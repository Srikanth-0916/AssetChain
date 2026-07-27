/**
 * CacheService — in-memory LRU cache with optional Redis backend.
 *
 * Usage: drop-in replacement for Redis in development.
 * When REDIS_URL is configured, swap the backing store to ioredis.
 * All methods are async for transparent upgrade.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // ms timestamp
}

export class CacheService {
  private readonly store = new Map<string, CacheEntry<any>>();
  private readonly defaultTTLMs: number;

  constructor(defaultTTLSeconds = 60) {
    this.defaultTTLMs = defaultTTLSeconds * 1000;

    // Periodic cleanup every 5 minutes
    setInterval(() => this.evictExpired(), 5 * 60 * 1000).unref();
  }

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = (ttlSeconds ?? this.defaultTTLMs / 1000) * 1000;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  /** Increment a counter, return new value. Useful for rate limiting. */
  async incr(key: string, ttlSeconds = 60): Promise<number> {
    const current = (await this.get<number>(key)) ?? 0;
    const next = current + 1;
    await this.set(key, next, ttlSeconds);
    return next;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  get size(): number { return this.store.size; }
}

/** Singleton cache — used across analytics, AI responses, etc. */
export const cache = new CacheService(300); // 5-minute default TTL
