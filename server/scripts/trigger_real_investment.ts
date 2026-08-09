import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';
import { supabaseAdmin } from '../src/config/database';
import { investmentService } from '../src/modules/investment/investment.service';
import { portfolioService } from '../src/services/portfolio.service';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALCHEMY_AMOY_URL = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';

const MARKETPLACE_ABI = [
  'function buyTokensWithPOL(string calldata assetId, uint256 quantity) external payable',
  'function createPOLSale(string calldata assetId, uint256 pricePerTokenWei, uint256 totalSupply) external',
  'function getPOLSaleConfig(string calldata assetId) external view returns (uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt)',
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 LIVE ON-CHAIN TRANSACTION GENERATOR & PIPELINE VERIFIER');
  console.log('═══════════════════════════════════════════════════════════');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY is missing in server/.env');
    process.exit(1);
  }

  // 1. Connect to Polygon Amoy network
  console.log('\nStep 1: Connect to Polygon Amoy RPC...');
  const provider = new ethers.JsonRpcProvider(ALCHEMY_AMOY_URL, undefined, { staticNetwork: true });
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log(`✅ Connected. Sender Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} POL`);

  if (balance < ethers.parseEther('0.005')) {
    console.error('❌ Insufficient POL balance in deployer wallet for gas/fees.');
    process.exit(1);
  }

  // 2. Ensure test user profile exists with matching wallet
  console.log('\nStep 2: Ensure test user profile exists in Supabase...');
  let testUserId = 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1';
  
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('wallet_address', wallet.address.toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    testUserId = existingProfile.id;
    console.log(`✅ Using existing profile for wallet. ID: ${existingProfile.id}, Role: ${existingProfile.role}`);
  } else {
    const { data: newProfile, error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: testUserId,
        full_name: 'Verified On-Chain Investor',
        email: `investor_${wallet.address.slice(2, 10).toLowerCase()}@assetchain.io`,
        wallet_address: wallet.address.toLowerCase(),
        role: 'investor',
        kyc_status: 'approved',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profErr) {
      console.error('❌ Profile setup error:', profErr.message);
      process.exit(1);
    }
    testUserId = newProfile.id;
    console.log(`✅ Investor profile created. ID: ${newProfile.id}, Wallet: ${newProfile.wallet_address}`);
  }

  // 3. Get or create a test asset
  console.log('\nStep 3: Get/create approved asset in Supabase...');
  let assetId = '7e5ae166-34d7-45fe-83f7-35df785e97d1'; // Manhattan Commercial Plaza
  const { data: asset } = await supabaseAdmin
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .maybeSingle();

  let assetTitle = 'Manhattan Commercial Plaza';
  if (!asset) {
    const { data: createdAsset, error: insErr } = await supabaseAdmin.from('assets').insert({
      id: assetId,
      owner_id: testUserId,
      title: assetTitle,
      description: 'Prime Commercial Property in Manhattan',
      asset_type: 'commercial_property',
      valuation: 1000000,
      token_supply: 10000,
      verification_status: 'approved',
      location: 'New York, USA',
    }).select().single();
    if (insErr) {
      console.error('❌ Failed creating asset:', insErr.message);
      process.exit(1);
    }
  }
  console.log(`✅ Asset ready: ${assetTitle} (${assetId})`);

  // 4. Check/Register POL sale on-chain
  console.log('\nStep 4: Check/Register POL sale on-chain...');
  const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, wallet);
  try {
    const saleConfig = await contract.getPOLSaleConfig(assetId);
    if (saleConfig.createdAt === 0n) {
      console.log('   Registering POL sale on-chain...');
      const regTx = await contract.createPOLSale(assetId, ethers.parseEther('0.0001'), 10000n);
      await regTx.wait(1);
      console.log('✅ Registered POL sale on-chain successfully.');
    } else {
      console.log(`✅ POL sale already registered. Price: ${ethers.formatEther(saleConfig.pricePerTokenWei)} POL`);
    }
  } catch (err: any) {
    console.warn('⚠️ Warning checking/registering POL sale:', err.message);
  }

  // 5. Execute real on-chain buyTokensWithPOL transaction
  console.log('\nStep 5: Execute real on-chain buyTokensWithPOL...');
  const quantity = 1n;
  const valueToSend = ethers.parseEther('0.0001'); // 1 token * 0.0001 POL

  const tx = await contract.buyTokensWithPOL(assetId, quantity, {
    value: valueToSend,
  });
  console.log(`🚀 Transaction Broadcasted: ${tx.hash}`);
  console.log(`🔗 PolygonScan Explorer   : https://amoy.polygonscan.com/tx/${tx.hash}`);
  console.log('⏳ Waiting for Polygon block confirmation...');
  const receipt = await tx.wait(1);
  console.log('✅ Transaction Mined in Block #' + receipt.blockNumber);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);

  // 6. Backend independent verification & Supabase persistence
  console.log('\nStep 6: Backend verification & Supabase persistence...');
  const result = await investmentService.confirmOnChainInvestment({
    transactionHash: tx.hash,
    walletAddress: wallet.address,
    assetId: assetId,
    quantity: Number(quantity),
    amountWei: valueToSend.toString(),
    userId: testUserId,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
  });

  console.log('✅ Backend successfully verified on-chain event and updated Supabase!');
  console.log(`   Investment ID : ${result.investmentId}`);
  console.log(`   Tokens Owned  : ${result.tokensOwned}`);
  console.log(`   Total Invested: $${result.totalInvested}`);
  console.log(`   PolygonScan   : ${result.polygonscanUrl}`);

  // 7. Portfolio Reconstruction Verification
  console.log('\nStep 7: Reconstructing user portfolio from Supabase...');
  const portfolio = await portfolioService.getPortfolio(testUserId, wallet.address);
  console.log('✅ Portfolio reconstructed successfully:');
  console.log(`   Total Invested: $${portfolio.summary.total_invested}`);
  console.log(`   Active Holdings: ${portfolio.holdings.length} assets`);
  for (const h of portfolio.holdings) {
    console.log(`   - Asset: ${h.asset.title}, Tokens: ${h.tokens_owned}, Value: $${h.current_value}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎉 REAL END-TO-END INVESTMENT ON POLYGON AMOY COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('💥 Execution failed:', err);
  process.exit(1);
});
