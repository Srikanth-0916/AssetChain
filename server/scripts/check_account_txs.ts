import { ethers } from 'ethers';

async function checkTxs() {
  const address = '0x5dFACC9Baf30C2d3a77f7dB67612c946e74604E3';
  const provider = new ethers.JsonRpcProvider('https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB', undefined, { staticNetwork: true });

  const count = await provider.getTransactionCount(address);
  const balance = await provider.getBalance(address);

  console.log(`Address: ${address}`);
  console.log(`Transaction Count (Nonce): ${count}`);
  console.log(`On-Chain Balance: ${ethers.formatEther(balance)} POL`);

  // Query block explorer api for recent transactions
  try {
    const res = await fetch(`https://api-amoy.polygonscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc`);
    const data: any = await res.json();
    if (data.status === '1' && data.result) {
      console.log(`\nRecent On-Chain Transactions (${data.result.length}):`);
      for (const tx of data.result.slice(0, 5)) {
        console.log(`- Hash: ${tx.hash}`);
        console.log(`  From: ${tx.from} -> To: ${tx.to}`);
        console.log(`  Value: ${ethers.formatEther(tx.value)} POL`);
        console.log(`  Block: #${tx.blockNumber}`);
      }
    }
  } catch (err: any) {
    console.error('API Query Error:', err.message);
  }
}

checkTxs();
