import { ethers } from 'ethers';

async function fetchBlock() {
  const providers = [
    'https://rpc-amoy.polygon.technology',
    'https://polygon-amoy.drpc.org',
    'https://rpc.ankr.com/polygon_amoy',
  ];

  for (const url of providers) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      const blockNum = await provider.getBlockNumber();
      console.log(`✅ RPC ${url} Live Block Number: ${blockNum}`);
      return blockNum;
    } catch (e: any) {
      console.warn(`⚠️ Failed ${url}:`, e.message);
    }
  }
}

fetchBlock().then(() => process.exit(0));
