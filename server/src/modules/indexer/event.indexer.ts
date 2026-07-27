/**
 * EventIndexer — in-memory indexed event store with reconciliation.
 *
 * Provides paginated event queries, tx hash lookup, and manual sync trigger.
 * The ContractListener feeds events into this store.
 */

import { v4 as uuidv4 } from 'uuid';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IndexedEvent {
  id: string;
  txHash: string;
  blockNumber: number;
  confirmations: number;
  contractAddress: string;
  eventName: string;
  args: Record<string, string>;
  timestamp: string;
  processed: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export class IndexedEventStore {
  private readonly events: IndexedEvent[] = [];
  private readonly txIndex = new Map<string, string[]>(); // txHash → event IDs

  addEvent(raw: Omit<IndexedEvent, 'id' | 'processed'>): IndexedEvent {
    // Deduplicate by txHash + eventName
    const isDuplicate = this.events.some(
      (e) => e.txHash === raw.txHash && e.eventName === raw.eventName
    );
    if (isDuplicate) return this.events.find(
      (e) => e.txHash === raw.txHash && e.eventName === raw.eventName
    )!;

    const event: IndexedEvent = { ...raw, id: uuidv4(), processed: true };
    this.events.push(event);

    // Update tx index
    const existing = this.txIndex.get(raw.txHash) || [];
    existing.push(event.id);
    this.txIndex.set(raw.txHash, existing);

    return event;
  }

  getByTxHash(txHash: string): IndexedEvent[] {
    const ids = this.txIndex.get(txHash) || [];
    return ids.map((id) => this.events.find((e) => e.id === id)!).filter(Boolean);
  }

  getAll(page = 1, limit = 20, eventName?: string): { events: IndexedEvent[]; total: number; page: number } {
    let filtered = eventName
      ? this.events.filter((e) => e.eventName === eventName)
      : this.events;

    filtered = [...filtered].reverse(); // newest first
    const total = filtered.length;
    const start = (page - 1) * limit;
    return { events: filtered.slice(start, start + limit), total, page };
  }

  /** Simulate synthetic events for demo when no real contract events exist. */
  seedDemoEvents(): void {
    if (this.events.length > 0) return;

    const syntheticEvents: Array<Omit<IndexedEvent, 'id' | 'processed'>> = [
      {
        txHash: '0x' + 'a'.repeat(64),
        blockNumber: 12345001,
        confirmations: 150,
        contractAddress: '0xAssetRegistry',
        eventName: 'AssetRegistered',
        args: { assetId: '1', owner: '0xOwner1', ipfsCid: 'QmMockCid1' } as Record<string, string>,
        timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
      },
      {
        txHash: '0x' + 'b'.repeat(64),
        blockNumber: 12345100,
        confirmations: 130,
        contractAddress: '0xAssetTokenFactory',
        eventName: 'AssetTokenized',
        args: { assetId: '1', tokenAddress: '0xACT001', totalSupply: '10000' } as Record<string, string>,
        timestamp: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
      {
        txHash: '0x' + 'c'.repeat(64),
        blockNumber: 12345200,
        confirmations: 100,
        contractAddress: '0xMarketplace',
        eventName: 'TokensPurchased',
        args: { assetId: '1', buyer: '0xInvestor1', amount: '500', price: '100' } as Record<string, string>,
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        txHash: '0x' + 'd'.repeat(64),
        blockNumber: 12345300,
        confirmations: 80,
        contractAddress: '0xGovernance',
        eventName: 'ProposalCreated',
        args: { proposalId: '1', proposer: '0xOwner1', description: 'Add solar panel maintenance fund' } as Record<string, string>,
        timestamp: new Date(Date.now() - 1 * 86400000).toISOString(),
      },
    ];


    syntheticEvents.forEach((e) => this.addEvent(e));
  }
}

export const indexedEventStore = new IndexedEventStore();

// Seed demo events on startup
indexedEventStore.seedDemoEvents();
