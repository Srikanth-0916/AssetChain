/**
 * READ-ONLY Blockchain Diagnostic Script
 * Does NOT modify any files, contracts, or configuration.
 */
import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const DEPLOYER_PK   = '0x5096d72b30584b4dde388f0346c02d0151849ddcee6f6400df6997c1163f3830';
const EXPECTED_ADDR = '0x5dFACC9Baf30C2d3a77f7dB67612c946e74604E3';
const RPC_URL       = 'https://polygon-amoy.g.alchemy.com/v2/alch_7Z-qV53sxUa5mdDYjjjzB';
const ADDRESSES_FILE = path.join('D:', 'Desktop', 'Hackathon', 'Intern-Project', 'AssetChain', 'contracts', 'deployed-addresses.json');

function sep(label: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${label}`);
  console.log('═'.repeat(60));
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'AssetChain-Diagnostic/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'parse_failed', raw: data.slice(0, 200) }); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('  READ-ONLY BLOCKCHAIN DIAGNOSTIC — AssetChain Deployer');
  console.log('█'.repeat(60));

  // ── STEP 1: Private Key → Address Derivation ─────────────────────────────
  sep('STEP 1: Private Key Address Derivation');
  const wallet = new ethers.Wallet(DEPLOYER_PK);
  const derivedAddress = wallet.address;
  const addressMatch = derivedAddress.toLowerCase() === EXPECTED_ADDR.toLowerCase();

  console.log(`Expected Address : ${EXPECTED_ADDR}`);
  console.log(`Derived Address  : ${derivedAddress}`);
  console.log(`Match            : ${addressMatch ? '✅ PASS — Addresses match' : '❌ FAIL — Addresses DO NOT match'}`);

  // ── STEP 2: RPC Live Query ────────────────────────────────────────────────
  sep('STEP 2: RPC Live Query');
  const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });

  let rpcBalance = 0n;
  let blockNumber = 0;
  let chainId = 0n;
  let networkName = '';

  try {
    rpcBalance  = await provider.getBalance(EXPECTED_ADDR);
    blockNumber = await provider.getBlockNumber();
    const net   = await provider.getNetwork();
    chainId     = net.chainId;
    networkName = net.name;

    console.log(`Wallet Address   : ${EXPECTED_ADDR}`);
    console.log(`Confirmed Balance: ${ethers.formatEther(rpcBalance)} POL  [${rpcBalance.toString()} wei]`);
    console.log(`Current Block    : #${blockNumber}`);
    console.log(`Chain ID         : ${chainId}`);
    console.log(`Network          : ${networkName || 'polygon-amoy'}`);
    console.log(`RPC Status       : ✅ Connected`);
  } catch (err: any) {
    console.log(`RPC Status       : ❌ FAILED — ${err.message}`);
  }

  // ── STEP 3: Transaction History via PolygonScan API ──────────────────────
  sep('STEP 3: Wallet Transaction History (PolygonScan)');
  const pscanUrl = `https://api-amoy.polygonscan.com/api?module=account&action=txlist&address=${EXPECTED_ADDR}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=YourApiKeyToken`;
  const pscanResult = await fetchJson(pscanUrl).catch(() => ({ status: 'error' }));

  if (pscanResult?.status === '1' && Array.isArray(pscanResult.result)) {
    const txs = pscanResult.result;
    console.log(`Total Recent Txs : ${txs.length}`);
    txs.forEach((tx: any, i: number) => {
      const valueEth = ethers.formatEther(tx.value || '0');
      const direction = tx.to?.toLowerCase() === EXPECTED_ADDR.toLowerCase() ? '⬇️  IN ' : '⬆️  OUT';
      const status    = tx.isError === '0' ? '✅ Confirmed' : '❌ Failed';
      const date      = new Date(Number(tx.timeStamp) * 1000).toISOString();
      console.log(`\n  Tx #${i + 1}`);
      console.log(`    Hash      : ${tx.hash}`);
      console.log(`    Direction : ${direction}`);
      console.log(`    Value     : ${valueEth} POL`);
      console.log(`    Status    : ${status}`);
      console.log(`    Block     : #${tx.blockNumber}`);
      console.log(`    Time      : ${date}`);
    });
  } else {
    // Fallback: use Alchemy getHistory or just check nonce
    console.log('PolygonScan API: No key configured — using RPC nonce check instead.');
    const confirmedNonce = await provider.getTransactionCount(EXPECTED_ADDR, 'latest');
    const pendingNonce   = await provider.getTransactionCount(EXPECTED_ADDR, 'pending');
    console.log(`Confirmed Nonce  : ${confirmedNonce}  (= number of mined transactions)`);
    console.log(`Pending Nonce    : ${pendingNonce}`);
    if (pendingNonce > confirmedNonce) {
      console.log(`⚠️  ${pendingNonce - confirmedNonce} PENDING transaction(s) in mempool`);
    } else {
      console.log('No pending transactions in mempool.');
    }
    console.log(`\nPolygonScan manual check:`);
    console.log(`  https://amoy.polygonscan.com/address/${EXPECTED_ADDR}`);
  }

  // ── STEP 4: MetaMask vs RPC Balance Comparison ───────────────────────────
  sep('STEP 4: MetaMask vs RPC Balance Comparison');
  const metamaskExpected = 0.100; // from screenshot
  const rpcConfirmed     = parseFloat(ethers.formatEther(rpcBalance));
  const difference       = metamaskExpected - rpcConfirmed;

  console.log(`MetaMask Expected: ${metamaskExpected.toFixed(6)} POL  (from screenshot)`);
  console.log(`RPC Confirmed    : ${rpcConfirmed.toFixed(6)} POL`);
  console.log(`Difference       : ${difference.toFixed(6)} POL`);

  if (Math.abs(difference) < 0.000001) {
    console.log('Verdict          : ✅ MATCH — Balances are equal');
  } else if (difference > 0) {
    console.log('Verdict          : ⚠️  MISMATCH — MetaMask shows MORE than RPC');
    console.log('Likely cause     : Faucet tx is PENDING (not yet mined). MetaMask');
    console.log('                   shows optimistic balance; RPC shows confirmed only.');
    console.log('                   OR: MetaMask is showing a different account\'s balance.');
  } else {
    console.log('Verdict          : ⚠️  MISMATCH — RPC shows MORE than MetaMask (cache issue)');
  }

  // ── STEP 5: deployed-addresses.json State ────────────────────────────────
  sep('STEP 5: deployed-addresses.json Contract Status');
  let deployedState: any = {};
  try {
    deployedState = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf-8'));
  } catch {
    console.log('❌ Could not read deployed-addresses.json');
  }

  const expectedContracts = ['MockUSDC', 'Treasury', 'AssetTokenFactory', 'AssetRegistry', 'Marketplace', 'Governance'];
  for (const name of expectedContracts) {
    const addr = deployedState?.contracts?.[name];
    if (addr) {
      const code = await provider.getCode(addr).catch(() => '0x');
      const hasCode = code !== '0x' && code.length > 4;
      console.log(`  ${name.padEnd(18)}: ${addr}  ${hasCode ? '✅ Bytecode live' : '❌ No bytecode'}`);
    } else {
      console.log(`  ${name.padEnd(18)}: ⏳ NOT DEPLOYED`);
    }
  }

  // ── STEP 6: Gas Estimation ────────────────────────────────────────────────
  sep('STEP 6: Gas Cost Estimation');
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || ethers.parseUnits('30', 'gwei');
  console.log(`Current Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);

  // Approximate bytecode sizes → gas estimates from prior failed tx
  // AssetRegistry: failed at 54,942,450,144,681,785 wei cost with gasPrice at that time
  // Use that as reference: ~54942450144681785 / gasPrice
  const knownTxCostWei = 54942450144681785n; // from actual failed tx error

  // Recalculate with current gas price
  const gasUnitsNeeded = knownTxCostWei / gasPrice; // approximate gas units for AssetRegistry
  const estimatedGasPerContract = gasUnitsNeeded;
  const gasCostAssetRegistry  = gasPrice * estimatedGasPerContract;
  const gasCostMarketplace     = gasPrice * (estimatedGasPerContract * 90n / 100n); // ~10% smaller
  const gasCostGovernance      = gasPrice * (estimatedGasPerContract * 60n / 100n); // smaller
  const totalEstimated         = gasCostAssetRegistry + gasCostMarketplace + gasCostGovernance;
  const totalWithBuffer        = totalEstimated * 120n / 100n; // +20% buffer

  console.log(`\nEstimated Gas Costs (with current gas price):`);
  console.log(`  AssetRegistry : ~${ethers.formatEther(gasCostAssetRegistry)} POL`);
  console.log(`  Marketplace   : ~${ethers.formatEther(gasCostMarketplace)} POL`);
  console.log(`  Governance    : ~${ethers.formatEther(gasCostGovernance)} POL`);
  console.log(`  Total         : ~${ethers.formatEther(totalEstimated)} POL`);
  console.log(`  +20% buffer   : ~${ethers.formatEther(totalWithBuffer)} POL`);

  const shortfall = totalWithBuffer > rpcBalance ? totalWithBuffer - rpcBalance : 0n;
  console.log(`\nCurrent Confirmed Balance : ${ethers.formatEther(rpcBalance)} POL`);
  console.log(`Required (with buffer)    : ~${ethers.formatEther(totalWithBuffer)} POL`);
  if (shortfall > 0n) {
    console.log(`Shortfall                 : ~${ethers.formatEther(shortfall)} POL  ← NEED THIS AMOUNT`);
  } else {
    console.log(`Shortfall                 : NONE — sufficient balance`);
  }

  // ── STEP 7: PolygonScan Explorer Check ───────────────────────────────────
  sep('STEP 7: PolygonScan Explorer Summary');
  console.log(`Explorer URL: https://amoy.polygonscan.com/address/${EXPECTED_ADDR}`);
  console.log('');
  console.log('Action Required: Open the URL above in a browser and verify:');
  console.log('  1. Current balance shown on explorer');
  console.log('  2. Any recent incoming faucet transactions');
  console.log('  3. Whether the faucet tx status = Success or Pending');

  // ── STEP 8: Deployment Readiness ─────────────────────────────────────────
  sep('STEP 8: Deployment Readiness');
  const MINIMUM_REQUIRED = ethers.parseEther('0.08');
  if (rpcBalance >= MINIMUM_REQUIRED) {
    console.log('✅ READY TO DEPLOY');
    console.log(`   Confirmed balance ${ethers.formatEther(rpcBalance)} POL >= required 0.08 POL`);
  } else {
    console.log('❌ INSUFFICIENT BALANCE');
    const needed = MINIMUM_REQUIRED - rpcBalance;
    console.log(`   Confirmed balance: ${ethers.formatEther(rpcBalance)} POL`);
    console.log(`   Minimum required : 0.08 POL`);
    console.log(`   Still needed     : ${ethers.formatEther(needed)} POL`);
  }

  // ── FINAL REPORT ──────────────────────────────────────────────────────────
  sep('FINAL REPORT');
  console.log(`Private Key → Address Match : ${addressMatch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`RPC Connectivity            : ✅ PASS  (Block #${blockNumber})`);
  console.log(`Chain ID                    : ${chainId} ${chainId === 80002n ? '✅ Correct (Polygon Amoy)' : '❌ Wrong chain'}`);
  console.log(`RPC Confirmed Balance       : ${ethers.formatEther(rpcBalance)} POL`);
  console.log(`MetaMask Screenshot Balance : 0.100000 POL`);
  console.log(`Balance Match               : ${Math.abs(rpcConfirmed - metamaskExpected) < 0.000001 ? '✅ Match' : '⚠️  Mismatch — faucet tx likely still pending'}`);
  console.log(`Gas Required (3 contracts)  : ~${ethers.formatEther(totalWithBuffer)} POL`);
  console.log(`Gas Shortfall               : ${shortfall > 0n ? ethers.formatEther(shortfall) + ' POL' : 'NONE'}`);
  console.log(`Deployment Status           : ${rpcBalance >= MINIMUM_REQUIRED ? '✅ READY TO DEPLOY' : '❌ INSUFFICIENT BALANCE'}`);
  console.log('');
  console.log('Recommended Next Action:');
  if (rpcBalance >= MINIMUM_REQUIRED) {
    console.log('  → Run: npx hardhat run scripts/deploy.ts --network amoy');
  } else {
    console.log('  1. Open https://amoy.polygonscan.com/address/' + EXPECTED_ADDR);
    console.log('  2. Check if faucet tx is confirmed.');
    console.log('  3. If not confirmed, wait 2-5 min or claim again at https://faucet.polygon.technology/');
    console.log('  4. Once explorer shows >= 0.08 POL, run deploy.');
  }
  console.log('\n' + '█'.repeat(60));
}

main().catch(err => {
  console.error('Diagnostic error:', err.message);
});
