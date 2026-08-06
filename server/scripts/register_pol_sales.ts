import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ALCHEMY_AMOY_URL = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';

const MARKETPLACE_ABI = [
  'function createPOLSale(string calldata assetId, uint256 pricePerTokenWei, uint256 totalSupply) external',
  'function getPOLSaleConfig(string calldata assetId) external view returns (uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt)',
];

const TARGET_ASSETS = [
  { id: '7e5ae166-34d7-45fe-83f7-35df785e97d1', name: 'Manhattan Commercial Plaza' },
  { id: '0e179d06-834d-4d01-895a-abfd6293aaab', name: 'Solar Farm Alpha 1' },
  { id: '6c8965cb-e7cb-464e-a7f1-676222faffdb', name: 'Luxury Villa Compound' },
];

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔑 REGISTERING ASSETS FOR ON-CHAIN POL SALES');
  console.log('═══════════════════════════════════════════════════════════');

  if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY is missing in server/.env');
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(ALCHEMY_AMOY_URL, undefined, { staticNetwork: true });
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log(`Deployer Address: ${wallet.address}`);
  console.log(`Marketplace     : ${MARKETPLACE_ADDRESS}`);

  const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, wallet);

  for (const asset of TARGET_ASSETS) {
    console.log(`\nInspecting asset: ${asset.name} (${asset.id})`);
    try {
      const config = await contract.getPOLSaleConfig(asset.id);
      if (config.createdAt === 0n) {
        console.log(`  Not registered on-chain. Registering...`);
        // Register at a low price for hackathon convenience: 0.0001 POL per token (100,000 gwei)
        const tx = await contract.createPOLSale(
          asset.id,
          ethers.parseEther('0.0001'), 
          10000n
        );
        console.log(`  Tx broadcasted: ${tx.hash}`);
        await tx.wait(1);
        console.log(`  ✅ Registered successfully!`);
      } else {
        console.log(`  ✅ Already registered. Price: ${ethers.formatEther(config.pricePerTokenWei)} POL`);
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to register ${asset.name}:`, err.message);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎉 REGISTRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
}

main();
