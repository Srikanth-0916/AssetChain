/**
 * seedMarketplaceAssets.ts
 *
 * Reads all tokenized/approved assets from Supabase and registers a native POL sale
 * for each asset in the deployed unified Marketplace contract.
 *
 * Usage:
 *   cd contracts
 *   npx ts-node scripts/seedMarketplaceAssets.ts
 */

import { ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const MARKETPLACE_ABI = [
  'function createPOLSale(string calldata assetId, uint256 pricePerTokenWei, uint256 totalSupply) external',
  'function getPOLSaleConfig(string calldata assetId) external view returns (tuple(uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt))',
  'function isPOLSaleAvailable(string calldata assetId) external view returns (bool)',
];

async function main() {
  let marketplaceAddress = process.env.MARKETPLACE_CONTRACT_ADDRESS;

  if (!marketplaceAddress) {
    const addressesPath = path.join(__dirname, '..', 'deployed-addresses.json');
    if (fs.existsSync(addressesPath)) {
      const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));
      marketplaceAddress = addresses.contracts?.Marketplace;
    }
  }

  if (!marketplaceAddress) {
    throw new Error(
      'MARKETPLACE_CONTRACT_ADDRESS not set. Run deploy.ts first or set env var.'
    );
  }

  console.log('📋 Unified Marketplace address:', marketplaceAddress);

  const [deployer] = await ethers.getSigners();
  console.log('📝 Using deployer wallet:', deployer.address);

  const contract = new ethers.Contract(
    marketplaceAddress,
    MARKETPLACE_ABI,
    deployer
  );

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.warn(
      '⚠️  SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Registering demo asset.'
    );
    const demoAssetId = 'demo-asset-' + Date.now();
    const demoPriceWei = ethers.parseEther('0.001'); // 0.001 POL per token
    const demoSupply = 10000n;

    console.log(`\n📌 Registering demo POL sale: ${demoAssetId}`);
    const tx = await contract.createPOLSale(demoAssetId, demoPriceWei, demoSupply);
    await tx.wait(1);
    console.log(`✅ Registered demo asset POL sale. Tx: ${tx.hash}`);
    return;
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/assets?verification_status=eq.tokenized&select=id,title,token_price,token_supply&limit=100`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase fetch failed: ${response.status} ${await response.text()}`);
  }

  const assets: Array<{
    id: string;
    title: string;
    token_price: number;
    token_supply: number;
  }> = await response.json();

  console.log(`\n📊 Found ${assets.length} tokenized assets in Supabase`);

  if (assets.length === 0) {
    console.log('ℹ️  No tokenized assets found. Register some assets first.');
    return;
  }

  let registered = 0;
  let skipped = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      const config = await contract.getPOLSaleConfig(asset.id);
      if (config.createdAt > 0n) {
        console.log(`⏭️  Skipping "${asset.title}" (${asset.id}) — already registered`);
        skipped++;
        continue;
      }

      const tokenPriceUSD = Number(asset.token_price);
      const polPerUsd = 0.5; // Conservative testnet ratio
      const priceInPOL = tokenPriceUSD * polPerUsd;
      const pricePerTokenWei = ethers.parseEther(priceInPOL.toFixed(6));
      const totalSupply = BigInt(asset.token_supply);

      console.log(`\n📌 Registering POL sale for "${asset.title}"`);
      console.log(`   ID:          ${asset.id}`);
      console.log(`   Token Price: $${tokenPriceUSD} USD → ${ethers.formatEther(pricePerTokenWei)} POL`);
      console.log(`   Supply:      ${totalSupply.toString()} tokens`);

      const tx = await contract.createPOLSale(asset.id, pricePerTokenWei, totalSupply);
      console.log(`   Tx sent:     ${tx.hash}`);
      await tx.wait(1);
      console.log(`   ✅ Confirmed!`);
      registered++;
    } catch (err: any) {
      console.error(`   ❌ Failed to register POL sale for "${asset.title}": ${err.message}`);
      failed++;
    }
  }

  console.log('\n════════════════════════════════════');
  console.log(`✅ Registered: ${registered}`);
  console.log(`⏭️  Skipped:    ${skipped}`);
  console.log(`❌ Failed:     ${failed}`);
  console.log('════════════════════════════════════');
  console.log('\n🎉 Seeding complete! Assets are now available for on-chain POL investment.');
}

main().catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exitCode = 1;
});
