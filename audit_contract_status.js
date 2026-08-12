const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';
const RPC = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const provider = new ethers.JsonRpcProvider(RPC, { chainId: 80002, name: 'polygon-amoy' });
const MARKETPLACE_ABI = [
  'function getPOLSaleConfig(string calldata assetId) external view returns (tuple(uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt))',
  'function isPOLSaleAvailable(string calldata assetId) external view returns (bool)',
  'function demoMode() external view returns (bool)',
  'function paymentToken() external view returns (address)',
];
const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
(async () => {
  const { data, error } = await supabase.from('assets').select('id,title,owner_id,verification_status,tokenized_at,token_supply,token_price,contract_address,created_at,updated_at').is('deleted_at', null).order('created_at',{ascending:false}).limit(10);
  if (error) {
    console.error('SUPABASE ERROR', JSON.stringify(error));
    process.exit(1);
  }
  console.log('MARKETPLACE_ADDRESS=' + MARKETPLACE_ADDRESS);
  const mode = await contract.demoMode();
  console.log('demoMode=' + mode);
  const token = await contract.paymentToken();
  console.log('paymentToken=' + token);
  for (const asset of data) {
    const cfg = await contract.getPOLSaleConfig(asset.id);
    const avail = await contract.isPOLSaleAvailable(asset.id);
    console.log('---');
    console.log(JSON.stringify({
      id: asset.id,
      title: asset.title,
      owner_id: asset.owner_id,
      verification_status: asset.verification_status,
      tokenized_at: asset.tokenized_at,
      contract_address: asset.contract_address,
      token_supply: asset.token_supply,
      token_price: asset.token_price,
      sale: {
        pricePerTokenWei: cfg.pricePerTokenWei.toString(),
        totalSupply: cfg.totalSupply.toString(),
        availableSupply: cfg.availableSupply.toString(),
        active: cfg.active,
        createdAt: cfg.createdAt.toString(),
      },
      isAvailable: avail,
    }, null, 2));
  }
})();
