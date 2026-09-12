interface CacheEntry<T> {
  value: T
  expiresAt: number
}

/**
 * Lightweight, high-performance in-memory cache with TTL support.
 * Designed for server-side Next.js route handlers and server components.
 */
export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()

  /**
   * Get an item from the cache. Returns undefined if missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }

    return entry.value as T
  }

  /**
   * Put an item into the cache with a specified Time-To-Live in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  /**
   * Delete a specific key from the cache.
   */
  delete(key: string): void {
    this.store.delete(key)
  }

  /**
   * Invalidate all keys matching a prefix string or regular expression.
   */
  deletePattern(pattern: RegExp | string): void {
    for (const key of this.store.keys()) {
      const matches =
        typeof pattern === 'string'
          ? key.startsWith(pattern)
          : pattern.test(key)

      if (matches) {
        this.store.delete(key)
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Helper to retrieve an existing cached item or fetch and cache it atomically.
   */
  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== undefined) {
      return cached
    }

    const fresh = await fetcher()
    this.set(key, fresh, ttlSeconds)
    return fresh
  }
}

export const memoryCache = new MemoryCache()
