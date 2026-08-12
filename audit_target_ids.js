const dotenv = require('dotenv');
const path = require('path');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });
const RPC = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';
const provider = new ethers.JsonRpcProvider(RPC, { chainId: 80002, name: 'polygon-amoy' });
const ids = [
  '7e5ae166-34d7-45fe-83f7-35df785e97d1',
  '0e179d06-834d-4d01-895a-abfd6293aaab',
  '6c8965cb-e7cb-464e-a7f1-676222faffdb',
];
const abi = [
  'function getPOLSaleConfig(string calldata assetId) external view returns (tuple(uint256 pricePerTokenWei, uint256 totalSupply, uint256 availableSupply, bool active, uint256 createdAt))',
  'function isPOLSaleAvailable(string calldata assetId) external view returns (bool)',
  'function demoMode() external view returns (bool)',
  'function paymentToken() external view returns (address)',
];
const contract = new ethers.Contract(MARKETPLACE_ADDRESS, abi, provider);
(async () => {
  console.log('MARKETPLACE_ADDRESS=', MARKETPLACE_ADDRESS);
  for (const id of ids) {
    const cfg = await contract.getPOLSaleConfig(id);
    const avail = await contract.isPOLSaleAvailable(id);
    console.log('id=', id);
    console.log('  active=', cfg.active.toString(), 'createdAt=', cfg.createdAt.toString(), 'availableSupply=', cfg.availableSupply.toString());
    console.log('  isAvailable=', avail);
  }
})();
