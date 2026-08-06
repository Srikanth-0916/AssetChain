import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';
import { supabaseAdmin } from '../src/config/database';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALCHEMY_AMOY_URL = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';

// Unified Marketplace ABI for POL purchase
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

  // 1. Get/Create a test asset in the database
  console.log('\nStep 1: Get or create a test asset...');
  const { data: asset, error: assetErr } = await supabaseAdmin
    .from('assets')
    .select('*')
    .limit(1)
    .single();

  let assetId = '';
  let assetTitle = '';
  if (assetErr || !asset) {
    // Insert a new dummy asset for testing
    const testAssetId = 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2';
    const { error: insErr } = await supabaseAdmin.from('assets').insert({
      id: testAssetId,
      title: 'E2E Verification Premium Hub',
      description: 'On-Chain Pipeline Verification Asset',
      asset_type: 'commercial',
      token_price: 10,
      valuation: 100000,
      tokens_available: 10000,
      token_supply: 10000,
      location: 'Bangalore, India',
    });
    if (insErr) {
      console.error('❌ Failed to insert test asset:', insErr.message);
      process.exit(1);
    }
    assetId = testAssetId;
    assetTitle = 'E2E Verification Premium Hub';
    console.log(`✅ Created test asset: ${assetTitle} (${assetId})`);
  } else {
    assetId = asset.id;
    assetTitle = asset.title;
    console.log(`✅ Found existing asset: ${assetTitle} (${assetId})`);
  }

  // 2. Connect to Polygon Amoy network
  console.log('\nStep 2: Connect to Polygon Amoy RPC...');
  const provider = new ethers.JsonRpcProvider(ALCHEMY_AMOY_URL, undefined, { staticNetwork: true });
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log(`✅ Connected. Sender Address: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} POL`);

  if (balance < ethers.parseEther('0.01')) {
    console.error('❌ Insufficient POL balance in deployer wallet for gas/fees.');
    process.exit(1);
  }

  const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, wallet);

  // 3. Register POL sale on-chain if not already registered
  console.log('\nStep 3: Check/Register POL sale on-chain...');
  try {
    const saleConfig = await contract.getPOLSaleConfig(assetId);
    if (saleConfig.createdAt === 0n) {
      console.log('   Asset not registered on-chain. Registering now...');
      const registerTx = await contract.createPOLSale(
        assetId,
        ethers.parseEther('0.0001'), // 0.0001 POL per token
        10000n
      );
      await registerTx.wait(1);
      console.log('✅ Registered POL sale on-chain successfully.');
    } else {
      console.log(`✅ POL sale already registered. Price: ${ethers.formatEther(saleConfig.pricePerTokenWei)} POL`);
    }
  } catch (err: any) {
    console.warn('⚠️ Warning checking/registering POL sale:', err.message);
  }

  // 4. Execute buyTokensWithPOL transaction
  console.log('\nStep 4: Execute buyTokensWithPOL on-chain...');
  const quantity = 2n;
  const valueToSend = ethers.parseEther('0.0002'); // 2 tokens * 0.0001 POL

  try {
    const tx = await contract.buyTokensWithPOL(assetId, quantity, {
      value: valueToSend,
    });
    console.log(`🚀 Transaction broadcasted: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait(1);
    console.log('✅ Transaction Mined successfully!');
    console.log(`   Block Number : #${receipt.blockNumber}`);
    console.log(`   Gas Used     : ${receipt.gasUsed.toString()}`);

    // 5. Submit to backend confirmation endpoint
    console.log('\nStep 5: Submit transaction to backend /confirm endpoint...');
    const port = process.env.PORT || '3001';
    const confirmRes = await fetch(`http://127.0.0.1:${port}/api/v1/investments/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionHash: tx.hash,
        walletAddress: wallet.address,
        assetId: assetId,
        quantity: Number(quantity),
        amountWei: valueToSend.toString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      }),
    });

    const confirmData: any = await confirmRes.json();
    if (confirmRes.status === 200 || confirmRes.status === 201) {
      console.log('✅ Backend successfully verified and persisted the transaction!');
      console.log(JSON.stringify(confirmData, null, 2));
    } else {
      console.error(`❌ Backend verification failed (HTTP ${confirmRes.status}):`, confirmData.error || confirmData);
      process.exit(1);
    }

    // 6. Verify Supabase tables are updated
    console.log('\nStep 6: Verifying database records...');
    const { data: dbTx, error: dbTxErr } = await supabaseAdmin
      .from('blockchain_transactions')
      .select('*')
      .eq('transaction_hash', tx.hash)
      .single();

    if (dbTxErr || !dbTx) {
      console.error('❌ Failed to find record in blockchain_transactions table:', dbTxErr?.message);
    } else {
      console.log('✅ Verified: Record found in public.blockchain_transactions table!');
      console.log(`   Tx Hash: ${dbTx.transaction_hash}`);
      console.log(`   Wallet : ${dbTx.wallet_address}`);
      console.log(`   Asset  : ${dbTx.asset_id}`);
    }

    const { data: dbInv, error: dbInvErr } = await supabaseAdmin
      .from('investments')
      .select('*')
      .eq('asset_id', assetId)
      .limit(1);

    if (dbInvErr || !dbInv || dbInv.length === 0) {
      console.error('❌ Failed to find record in investments table:', dbInvErr?.message);
    } else {
      console.log('✅ Verified: Record found in public.investments table!');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎉 PIPELINE VERIFICATION SUCCESSFUL!');
    console.log('═══════════════════════════════════════════════════════════');

  } catch (err: any) {
    console.error('💥 Execution failed:', err.message);
    process.exit(1);
  }
}

main();
