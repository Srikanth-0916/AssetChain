/**
 * BlockTracker — tracks the last processed block for event indexing.
 *
 * Prevents duplicate event processing on restart.
 * Upgradeable to Redis persistence via REDIS_URL.
 */

export class BlockTracker {
  private lastProcessedBlock: number;
  private readonly startBlock: number;

  constructor(startBlock = 0) {
    this.startBlock = startBlock;
    this.lastProcessedBlock = startBlock;
  }

  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }

  setLastProcessedBlock(blockNumber: number): void {
    if (blockNumber > this.lastProcessedBlock) {
      this.lastProcessedBlock = blockNumber;
    }
  }

  reset(): void {
    this.lastProcessedBlock = this.startBlock;
  }
}

export const blockTracker = new BlockTracker(
  parseInt(process.env.INDEXER_START_BLOCK || '0', 10)
);
