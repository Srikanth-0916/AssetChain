/**
 * web3InvestmentService.ts
 *
 * Real on-chain investment execution service for AssetChain.
 * Replaces simulated payment flow with genuine MetaMask → Polygon Amoy transactions.
 *
 * Granular Stepper Flow:
 *   1. preparing            — "Preparing Transaction..."
 *   2. checking_network     — "Checking Wallet & Polygon Amoy Network..."
 *   3. awaiting_metamask    — "Waiting for MetaMask Approval..."
 *   4. submitting           — "Submitting to Polygon..."
 *   5. mining               — "Waiting for Confirmation..."
 *   6. syncing_database     — "Updating Portfolio..."
 *   7. complete             — "Investment Complete!"
 *
 * Pre-flight Checks:
 *   ✅ Wallet connected
 *   ✅ Network on Polygon Amoy (Chain ID 80002)
 *   ✅ Sufficient POL balance for price + gas buffer
 *   ✅ Asset is available (not paused/sold out)
 *   ✅ Requested quantity <= remaining supply
 *   ✅ Gracefully handles user rejection in MetaMask
 */

import { ethers } from 'ethers';
import api from './api';
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  POLYGON_AMOY_CHAIN_ID,
  POLYGON_AMOY_RPC_URL,
  buildPolygonScanTxUrl,
  isContractConfigured,
} from '../config/contracts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InvestmentStage =
  | 'idle'
  | 'preparing'
  | 'checking_network'
  | 'fetching_price'
  | 'awaiting_metamask'
  | 'submitting'
  | 'mining'
  | 'syncing_database'
  | 'complete'
  | 'error';

export interface InvestmentResult {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  amountPaidWei: string;
  amountPaidPOL: string;
  explorerUrl: string;
  timestamp: number;
}

export interface InvestmentProgress {
  stage: InvestmentStage;
  txHash?: string;
  message: string;
}

export type OnProgressCallback = (progress: InvestmentProgress) => void;

// ─── Error handling ────────────────────────────────────────────────────────────

function parseWeb3Error(err: any): string {
  // User rejected in MetaMask
  if (
    err?.code === 4001 ||
    err?.code === 'ACTION_REJECTED' ||
    err?.message?.includes('user rejected') ||
    err?.message?.includes('User denied')
  ) {
    return 'Transaction cancelled. You rejected the MetaMask request.';
  }

  // Insufficient funds
  if (
    err?.code === 'INSUFFICIENT_FUNDS' ||
    err?.message?.includes('insufficient funds') ||
    err?.message?.includes('insufficient balance') ||
    err?.message?.includes('exceeds balance')
  ) {
    return 'Insufficient POL balance for purchase + gas. Get testnet POL from https://faucet.polygon.technology/';
  }

  // Wrong network
  if (
    err?.code === 'NETWORK_ERROR' ||
    err?.message?.includes('network') ||
    err?.message?.includes('chain')
  ) {
    return 'Wrong network. Please switch to Polygon Amoy Testnet in MetaMask.';
  }

  // Contract revert
  if (err?.code === 'CALL_EXCEPTION' || err?.message?.includes('revert')) {
    const reason = err?.reason || err?.data?.message || 'Contract reverted';
    if (reason.includes('No POL sale registered')) return 'This asset is not yet registered for POL sales on-chain.';
    if (reason.includes('POL sale is not active')) return 'This asset sale is currently paused.';
    if (reason.includes('Insufficient token supply')) return 'Requested quantity exceeds remaining token supply.';
    if (reason.includes('Incorrect POL amount sent')) return 'Incorrect POL payment amount sent.';
    return `Transaction reverted: ${reason}`;
  }

  // Timeout
  if (err?.message?.includes('timeout') || err?.message?.includes('Timeout')) {
    return 'Transaction is taking too long to mine. Check PolygonScan for status.';
  }

  return err?.message || 'Investment transaction failed. Please try again.';
}

// ─── Network & Balance helpers ────────────────────────────────────────────────

async function ensureCorrectNetwork(provider: ethers.BrowserProvider): Promise<void> {
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);

  if (currentChainId !== POLYGON_AMOY_CHAIN_ID) {
    const eth = (window as any).ethereum;
    if (!eth) throw new Error('MetaMask not found. Please install MetaMask extension.');

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}` }],
      });
    } catch (switchErr: any) {
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${POLYGON_AMOY_CHAIN_ID.toString(16)}`,
              chainName: 'Polygon Amoy Testnet',
              nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
              rpcUrls: [POLYGON_AMOY_RPC_URL],
              blockExplorerUrls: ['https://amoy.polygonscan.com/'],
            },
          ],
        });
      } else if (switchErr.code === 4001) {
        throw new Error('You rejected switching to Polygon Amoy. Please switch network in MetaMask.');
      } else {
        throw switchErr;
      }
    }
  }
}

// ─── Main investment service ───────────────────────────────────────────────────

class Web3InvestmentService {
  /**
   * Pre-flight checks + Real on-chain investment execution.
   */
  async executeInvestment(
    signer: ethers.JsonRpcSigner,
    assetId: string,
    quantity: number,
    fallbackTokenPriceUSD: number,
    onProgress: OnProgressCallback
  ): Promise<InvestmentResult> {

    // ─── Pre-flight 1: Contract Config ───────────────────────────────────────
    if (!isContractConfigured()) {
      throw new Error(
        'Marketplace contract address not configured. Run deploy script or set VITE_MARKETPLACE_CONTRACT_ADDRESS in .env'
      );
    }

    onProgress({ stage: 'preparing', message: 'Preparing Transaction...' });

    // ─── Pre-flight 2: Network Verification ───────────────────────────────────
    const provider = signer.provider as ethers.BrowserProvider;
    onProgress({ stage: 'checking_network', message: 'Checking Wallet & Polygon Amoy Network...' });
    await ensureCorrectNetwork(provider);

    // ─── Pre-flight 3: Wallet & Contract Read ─────────────────────────────────
    onProgress({ stage: 'fetching_price', message: 'Checking Asset Availability & Price...' });

    const contract = new ethers.Contract(
      MARKETPLACE_ADDRESS,
      MARKETPLACE_ABI,
      signer
    );

    let pricePerTokenWei: bigint;
    let availableSupply: bigint = 10000n;

    try {
      const config = await (contract as any).getPOLSaleConfig(assetId);

      if (!config || config.createdAt === 0n) {
        throw new Error('No POL sale registered for this asset. Please choose a registered asset.');
      }
      if (!config.active) {
        throw new Error('POL sale is not active: This asset sale is paused.');
      }
      if (config.availableSupply < BigInt(quantity)) {
        throw new Error(`Insufficient token supply: Only ${config.availableSupply} tokens remain.`);
      }

      pricePerTokenWei = config.pricePerTokenWei;
      availableSupply = config.availableSupply;
    } catch (err: any) {
      if (err?.message?.includes('POL sale is not active') || err?.message?.includes('No POL sale registered') || err?.message?.includes('Insufficient token supply')) {
        throw err;
      }
      throw new Error(`Failed to validate on-chain sale: ${parseWeb3Error(err)}`);
    }

    const totalCostWei = pricePerTokenWei * BigInt(quantity);
    const totalCostPOL = ethers.formatEther(totalCostWei);

    // ─── Pre-flight 4: Balance Check ──────────────────────────────────────────
    const buyerAddress = await signer.getAddress();
    const balanceWei = await provider.getBalance(buyerAddress);
    const gasReserveWei = ethers.parseEther('0.005'); // 0.005 POL gas reserve

    if (balanceWei < totalCostWei + gasReserveWei) {
      const balancePOL = ethers.formatEther(balanceWei);
      throw new Error(
        `Insufficient POL balance. You have ${balancePOL} POL, but need ${totalCostPOL} POL + gas reserve.`
      );
    }

    // ─── Pre-flight 5: Gas Estimation ─────────────────────────────────────────
    let gasEstimate: bigint;
    try {
      gasEstimate = await (contract as any).buyTokensWithPOL.estimateGas(assetId, BigInt(quantity), {
        value: totalCostWei,
      });
    } catch {
      gasEstimate = 120000n;
    }

    // ─── Stage 3: Awaiting MetaMask Approval ──────────────────────────────────
    onProgress({
      stage: 'awaiting_metamask',
      message: `Waiting for MetaMask Approval... (${totalCostPOL} POL)`,
    });

    let tx: ethers.TransactionResponse;
    try {
      tx = await (contract as any).buyTokensWithPOL(assetId, BigInt(quantity), {
        value: totalCostWei,
        gasLimit: (gasEstimate * 120n) / 100n, // +20% buffer
      });
    } catch (submitErr: any) {
      throw new Error(parseWeb3Error(submitErr));
    }

    // ─── Stage 4: Submitting to Polygon ───────────────────────────────────────
    onProgress({
      stage: 'submitting',
      txHash: tx.hash,
      message: 'Submitting to Polygon Network...',
    });

    // ─── Stage 5: Waiting for Confirmation ────────────────────────────────────
    onProgress({
      stage: 'mining',
      txHash: tx.hash,
      message: 'Waiting for Confirmation...',
    });

    let receipt: ethers.TransactionReceipt | null;
    try {
      receipt = await tx.wait(1);
    } catch (waitErr: any) {
      throw new Error(`Transaction failed after submission: ${parseWeb3Error(waitErr)}`);
    }

    if (!receipt || receipt.status !== 1) {
      throw new Error('Transaction reverted on Polygon Amoy. Check PolygonScan for details.');
    }

    // ─── Stage 6: Updating Portfolio ──────────────────────────────────────────
    onProgress({
      stage: 'syncing_database',
      txHash: tx.hash,
      message: 'Updating Portfolio...',
    });

    try {
      await api.post('/investments/confirm', {
        transactionHash: tx.hash,
        walletAddress: buyerAddress,
        assetId,
        quantity,
        amountWei: totalCostWei.toString(),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      });
    } catch (apiErr: any) {
      console.warn('[Web3Investment] Backend sync warning:', apiErr.message);
    }

    // ─── Stage 7: Investment Complete ─────────────────────────────────────────
    const result: InvestmentResult = {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      amountPaidWei: totalCostWei.toString(),
      amountPaidPOL: totalCostPOL,
      explorerUrl: buildPolygonScanTxUrl(tx.hash),
      timestamp: Date.now(),
    };

    onProgress({
      stage: 'complete',
      txHash: tx.hash,
      message: 'Investment Complete!',
    });

    return result;
  }

  /**
   * Get the current POL price for a given quantity of an asset.
   */
  async getOnChainPrice(
    provider: ethers.Provider,
    assetId: string,
    quantity: number
  ): Promise<{ priceWei: bigint; pricePOL: string; isOnChain: boolean }> {
    if (!isContractConfigured()) {
      return { priceWei: 0n, pricePOL: '0', isOnChain: false };
    }

    try {
      const contract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );
      const priceWei: bigint = await (contract as any).calculatePOLPrice(assetId, BigInt(quantity));
      return { priceWei, pricePOL: ethers.formatEther(priceWei), isOnChain: true };
    } catch {
      return { priceWei: 0n, pricePOL: '0', isOnChain: false };
    }
  }

  async checkPOLSaleAvailability(assetId: string): Promise<{ available: boolean; message: string; pricePOL?: string }> {
    if (!isContractConfigured()) {
      return { available: false, message: 'Marketplace contract is not configured.' };
    }

    try {
      const provider = new ethers.JsonRpcProvider(POLYGON_AMOY_RPC_URL, {
        chainId: POLYGON_AMOY_CHAIN_ID,
        name: 'polygon-amoy',
      });
      const contract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);
      const available: boolean = await (contract as any).isPOLSaleAvailable(assetId);

      if (available) {
        const config = await (contract as any).getPOLSaleConfig(assetId);
        return {
          available: true,
          message: 'Asset is registered and available for POL purchase on-chain.',
          pricePOL: ethers.formatEther(config.pricePerTokenWei),
        };
      }

      const config = await (contract as any).getPOLSaleConfig(assetId);
      if (!config || config.createdAt === 0n) {
        return { available: false, message: 'This asset is not yet registered for POL sale on-chain.' };
      }
      if (!config.active) {
        return { available: false, message: 'This asset has a POL sale, but it is currently paused.' };
      }
      if (config.availableSupply === 0n) {
        return { available: false, message: 'This asset is sold out on-chain.' };
      }

      return { available: false, message: 'The asset is not currently available for POL purchase.' };
    } catch (err: any) {
      return {
        available: false,
        message: `Could not verify on-chain sale availability: ${parseWeb3Error(err)}`,
      };
    }
  }
}

export const web3InvestmentService = new Web3InvestmentService();
