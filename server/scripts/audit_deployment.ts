import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';

// Load server .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function auditRPC() {
  const alchemyAmoyUrl = 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
  const drpcUrl = 'https://polygon-amoy.drpc.org';

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔍 STEP 1 & 3: HARDHAT & RPC CONNECTION AUDIT');
  console.log('═══════════════════════════════════════════════════════════');

  for (const [name, url] of Object.entries({ Alchemy: alchemyAmoyUrl, dRPC: drpcUrl })) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();
      console.log(`✅ [${name} RPC] Status: Reachable`);
      console.log(`   URL:          ${url.slice(0, 48)}...`);
      console.log(`   Chain ID:     ${network.chainId.toString()} (Polygon Amoy target: 80002)`);
      console.log(`   Latest Block: #${blockNumber}`);
    } catch (err: any) {
      console.error(`❌ [${name} RPC] Failed: ${err.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🗝️ STEP 2 & 4: DEPLOYER WALLET & BALANCE AUDIT');
  console.log('═══════════════════════════════════════════════════════════');

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (!privateKey || privateKey.includes('0000000000000000000000000000000000000000000000000000000000000001')) {
    console.log('⚠️  DEPLOYER_PRIVATE_KEY is currently set to the default placeholder in .env!');
    console.log('   PREREQUISITE ACTION REQUIRED: Set DEPLOYER_PRIVATE_KEY in server/.env or contracts/.env');
    return { readyToDeploy: false, reason: 'DEPLOYER_PRIVATE_KEY is placeholder' };
  }

  try {
    const wallet = new ethers.Wallet(privateKey);
    console.log(`✅ Private Key Format: Valid 256-bit key`);
    console.log(`   Derived Address:    ${wallet.address}`);

    const provider = new ethers.JsonRpcProvider(alchemyAmoyUrl, undefined, { staticNetwork: true });
    const balanceWei = await provider.getBalance(wallet.address);
    const balancePOL = ethers.formatEther(balanceWei);

    console.log(`   Current Balance:    ${balancePOL} POL`);

    const estimatedDeploymentGas = 0.05; // ~0.05 POL needed for full contract suite deployment

    if (parseFloat(balancePOL) < estimatedDeploymentGas) {
      console.log(`\n❌ INSUFFICIENT POL BALANCE FOR DEPLOYMENT!`);
      console.log(`   Current Balance:  ${balancePOL} POL`);
      console.log(`   Required Gas Est: ~${estimatedDeploymentGas} POL`);
      console.log(`   Shortfall:        ~${(estimatedDeploymentGas - parseFloat(balancePOL)).toFixed(4)} POL`);
      console.log(`\n👉 PREREQUISITE ACTION REQUIRED:`);
      console.log(`   Please fund wallet address ${wallet.address} with testnet POL.`);
      console.log(`   Polygon Faucet: https://faucet.polygon.technology/`);
      return { readyToDeploy: false, reason: 'Insufficient POL balance', walletAddress: wallet.address, balancePOL };
    }

    console.log('✅ Balance is sufficient for deployment.');
    return { readyToDeploy: true, walletAddress: wallet.address, balancePOL };
  } catch (err: any) {
    console.error(`❌ Invalid Private Key format: ${err.message}`);
    return { readyToDeploy: false, reason: `Invalid Private Key: ${err.message}` };
  }
}

auditRPC().catch((e) => console.error(e));
