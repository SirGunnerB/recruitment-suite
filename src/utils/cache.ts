type CacheEntry<T> = {
  value: T;
  timestamp: number;
};

class Cache {
  private storage: Map<string, CacheEntry<any>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default TTL
    this.storage = new Map();
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.storage.set(key, {
      value,
      timestamp: Date.now() + ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp) {
      this.storage.delete(key);
      return null;
    }

    return entry.value as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  // Get all valid entries
  entries(): [string, any][] {
    return Array.from(this.storage.entries())
      .filter(([_, entry]) => Date.now() <= entry.timestamp)
      .map(([key, entry]) => [key, entry.value]);
  }
}

export const globalCache = new Cache();
