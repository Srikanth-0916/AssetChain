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
    // Disabled to prevent mock event seeding
  }
}

export const indexedEventStore = new IndexedEventStore();

// Seed demo events on startup
indexedEventStore.seedDemoEvents();
