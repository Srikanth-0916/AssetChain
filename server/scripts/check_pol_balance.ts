import { ethers } from 'ethers';

async function checkBalance() {
  const address = '0x5dFACC9Baf30C2d3a77f7dB67612c946e74604E3';
  const urls = [
    'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB',
    'https://polygon-amoy.drpc.org',
    'https://rpc.ankr.com/polygon_amoy',
  ];

  for (const url of urls) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      const balance = await provider.getBalance(address);
      console.log(`[${url}] Balance for ${address}: ${ethers.formatEther(balance)} POL`);
    } catch (err: any) {
      console.error(`[${url}] Error: ${err.message}`);
    }
  }
}

checkBalance();
