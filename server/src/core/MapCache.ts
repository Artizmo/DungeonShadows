import fs from "node:fs/promises";
import path from "node:path";
import { Log } from "~/shared/core/Logger.js";
import type Zone from "~/core/Zone";

export interface Chunk {
  x: number;
  y: number;
  textureBytes: Uint8Array;
}

interface ChunkCacheEntry {
  data: Chunk;
  lastAccessed: number;
}

export default class MapCache {
  // Key format: "areaId:zoneName:chunkKey" (e.g., "sephus:Arena:3_0")
  private cache = new Map<string, ChunkCacheEntry>();

  // Deduplicate concurrent disk requests for the same chunk
  private loadingPromises = new Map<string, Promise<Chunk | undefined>>();

  // Memory Safeguards
  private readonly MAX_CACHED_CHUNKS = 250; // Cap RAM usage (~20-40MB max depending on webp size)
  private readonly TTL_MS = 1000 * 60 * 10; // 10 minutes inactive eviction

  constructor() {
    this.startCleanupLoop();
  }

  private buildCacheKey(zone: Zone, chunkKey: string): string {
    return `${zone.areaId}:${zone.name}:${chunkKey}`;
  }

  /**
   * 🟢 O(1) Instant RAM Read (Main Tick Thread)
   * Never blocks execution. Returns undefined on cache miss.
   */
  public getChunkSync(zone: Zone, chunkKey: string): Chunk | undefined {
    const key = this.buildCacheKey(zone, chunkKey);
    const entry = this.cache.get(key);

    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }

    return undefined;
  }

  /**
   * 🟢 Background Disk Reader
   * Loads chunk into RAM off the main thread and returns it.
   */
  public async fetchAndCacheChunk(
    zone: Zone,
    chunkKey: string
  ): Promise<Chunk | undefined> {
    const key = this.buildCacheKey(zone, chunkKey);

    // 1. Check RAM cache again
    const hit = this.getChunkSync(zone, chunkKey);
    if (hit) return hit;

    // 2. Return active read if already in-flight (prevents duplicate disk reads)
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // 3. Queue disk read
    const loadPromise = this.readChunkFromDisk(zone, chunkKey)
      .then((chunk) => {
        if (chunk) {
          this.enforceMemoryCap();
          this.cache.set(key, {
            data: chunk,
            lastAccessed: Date.now(),
          });
        }
        return chunk;
      })
      .finally(() => {
        this.loadingPromises.delete(key);
      });

    this.loadingPromises.set(key, loadPromise);
    return loadPromise;
  }

  /**
   * Disk IO helper reading Option A style (e.g. "3_0.webp")
   */
  private async readChunkFromDisk(
    zone: Zone,
    chunkKey: string
  ): Promise<Chunk | undefined> {
    const [strX, strY] = chunkKey.split("_");
    const gridX = parseInt(strX, 10);
    const gridY = parseInt(strY, 10);

    const chunkFilePath = path.resolve(
      process.cwd(),
      `../shared/data/world/areas/${zone.areaId}/zones/${zone.name}/chunks/${gridX}_${gridY}.webp`
    );

    try {
      const fileBuffer = await fs.readFile(chunkFilePath);
      return {
        x: gridX,
        y: gridY,
        textureBytes: new Uint8Array(fileBuffer),
      };
    } catch (e) {
      Log.DATA.ERROR(`❌ Chunk missing on disk: ${chunkFilePath}`);
      return undefined;
    }
  }

  /**
   * Evicts the least recently accessed chunks when RAM capacity is reached.
   */
  private enforceMemoryCap(): void {
    if (this.cache.size < this.MAX_CACHED_CHUNKS) return;

    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanupLoop(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.lastAccessed > this.TTL_MS) {
          this.cache.delete(key);
        }
      }
    }, 1000 * 60 * 5);
  }
}

export const mapCache = new MapCache();