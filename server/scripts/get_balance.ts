import { ethers } from 'ethers';

async function main() {
  const p = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB', undefined, { staticNetwork: true });
  const b = await p.getBalance('0x5dFACC9Baf30C2d3a77f7dB67612c946e74604E3');
  console.log(`Current Deployer POL Balance: ${ethers.formatEther(b)} POL`);
}

main();
