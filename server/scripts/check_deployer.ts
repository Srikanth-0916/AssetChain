import { ethers } from 'ethers';

async function main() {
  const p = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB', undefined, { staticNetwork: true });
  
  // Check deployer wallet
  const deployer = '0x5dFACC9Baf30C2d3a77f7dB67612c946e74604E3';
  const b1 = await p.getBalance(deployer);
  console.log(`Deployer (${deployer}): ${ethers.formatEther(b1)} POL`);
  
  // Get latest block to confirm RPC is live
  const block = await p.getBlockNumber();
  console.log(`Latest Block: #${block}`);
  
  // Get pending nonce (includes pending txs)
  const nonce = await p.getTransactionCount(deployer, 'pending');
  console.log(`Pending nonce: ${nonce}`);
}

main();
