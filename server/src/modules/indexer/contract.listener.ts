/**
 * ContractListener — polls Polygon Amoy for smart contract events.
 *
 * Uses ethers.js getLogs() polling (safe without WebSocket).
 * Runs every 30 seconds. Processes: AssetRegistered, AssetTokenized,
 * TokensPurchased, ProposalCreated, VoteCast, DividendClaimed.
 */

import { ethers } from 'ethers';
import { env } from '../../config/env';
import { blockTracker } from './block.tracker';
import { indexedEventStore } from './event.indexer';

// Minimal ABI for event signatures we care about
const EVENT_SIGNATURES = {
  AssetRegistered: 'event AssetRegistered(uint256 indexed assetId, address indexed owner, string ipfsCid)',
  AssetTokenized: 'event AssetTokenized(uint256 indexed assetId, address tokenAddress, uint256 totalSupply)',
  TokensPurchased: 'event TokensPurchased(uint256 indexed assetId, address indexed buyer, uint256 amount, uint256 price)',
  ProposalCreated: 'event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string description)',
  VoteCast: 'event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight)',
  DividendClaimed: 'event DividendClaimed(address indexed claimant, uint256 amount)',
};

const INTERFACE = new ethers.Interface(Object.values(EVENT_SIGNATURES));

const EVENT_TOPIC_HASHES = Object.keys(EVENT_SIGNATURES)
  .map((name) => INTERFACE.getEvent(name)?.topicHash)
  .filter((hash): hash is string => Boolean(hash));

export class ContractListener {
  private provider: ethers.JsonRpcProvider | null = null;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;

  start(intervalMs = 30_000): void {
    if (this.isRunning) return;
    try {
      if (!this.provider) {
        this.provider = new ethers.JsonRpcProvider(env.POLYGON_AMOY_RPC_URL);
      }
      this.isRunning = true;
      // Initial poll
      this.poll().catch(() => {});
      this.intervalHandle = setInterval(() => this.poll().catch(() => {}), intervalMs);
      console.log('[Indexer] Contract listener started (polling every 30s)');
    } catch (error) {
      console.warn('[Indexer] Failed to start contract listener:', (error as Error).message);
    }
  }

  stop(): void {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.isRunning = false;
  }

  private async poll(): Promise<void> {
    if (!this.provider) return;
    try {
      const latestBlock = await this.provider.getBlockNumber();
      const fromBlock = blockTracker.getLastProcessedBlock() || Math.max(0, latestBlock - 1000);
      const toBlock = latestBlock;

      if (fromBlock >= toBlock) return;

      const logs = await this.provider.getLogs({
        fromBlock,
        toBlock,
        topics: [EVENT_TOPIC_HASHES],
      });

      for (const log of logs) {
        await this.processLog(log, latestBlock);
      }

      blockTracker.setLastProcessedBlock(toBlock);

      if (logs.length > 0) {
        console.log(`[Indexer] Processed ${logs.length} events from blocks ${fromBlock}-${toBlock}`);
      }
    } catch (error) {
      console.warn('[Indexer] Poll error:', (error as Error).message);
    }
  }

  private async processLog(log: ethers.Log, latestBlock: number): Promise<void> {
    try {
      const parsed = INTERFACE.parseLog({ data: log.data, topics: log.topics as string[] });
      if (!parsed) return;

      indexedEventStore.addEvent({
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        confirmations: latestBlock - log.blockNumber,
        contractAddress: log.address,
        eventName: parsed.name,
        args: Object.fromEntries(parsed.args.map((v, i) => [parsed.fragment.inputs[i].name, v?.toString()])),
        timestamp: new Date().toISOString(),
      });
    } catch { /* Skip unparseable logs */ }
  }
}

export const contractListener = new ContractListener();
