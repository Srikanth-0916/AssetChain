const dotenv = require('dotenv');
const path = require('path');
const { ethers } = require('ethers');

dotenv.config({ path: path.join(process.cwd(), 'server/.env') });
const RPC = process.env.POLYGON_AMOY_RPC_URL || 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_CONTRACT_ADDRESS || '0x835aaF7DAF1A323b42bF7367d037e55659EB3BcB';
const provider = new ethers.JsonRpcProvider(RPC, { chainId: 80002, name: 'polygon-amoy' });
(async () => {
  const event1 = ethers.id('POLSaleCreated(string,uint256,uint256)');
  const event2 = ethers.id('InvestmentCompleted(string,address,uint256,uint256,uint256)');
  const filter1 = { address: MARKETPLACE_ADDRESS, topics: [event1] };
  const filter2 = { address: MARKETPLACE_ADDRESS, topics: [event2] };
  console.log('MARKETPLACE_ADDRESS=', MARKETPLACE_ADDRESS);
  console.log('POLSaleCreated topic=', event1);
  console.log('InvestmentCompleted topic=', event2);
  const logs1 = await provider.getLogs({ ...filter1, fromBlock: 0, toBlock: 'latest' });
  const logs2 = await provider.getLogs({ ...filter2, fromBlock: 0, toBlock: 'latest' });
  console.log('POLSaleCreated count=', logs1.length);
  console.log('InvestmentCompleted count=', logs2.length);
  if (logs1.length > 0) console.log('First POLSaleCreated log:', JSON.stringify(logs1[0], null, 2));
  if (logs2.length > 0) console.log('First InvestmentCompleted log:', JSON.stringify(logs2[0], null, 2));
})();
