import fs from "node:fs/promises";
import path from "node:path";
import { CHUNK_SIZE } from "~/shared/core/constants";
import type Zone from "~/core/Zone";
import type World from "./World";

export interface Chunk {
  x: number;
  y: number;
  textureBytes: Uint8Array;
}

interface ChunkCacheEntry {
  data: Chunk | null; // 🟢 Can be null for confirmed non-existent chunks (negative cache)
  lastAccessed: number;
}

export default class MapManager {
  private world: World;
  // Key format: "areaId:zoneName:chunkKey" (e.g., "sephus:Arena:3_0")
  private cache = new Map<string, ChunkCacheEntry>();

  // Deduplicate concurrent disk requests for the same chunk
  private loadingPromises = new Map<string, Promise<Chunk | null>>();

  // Memory Safeguards
  private readonly MAX_CACHED_CHUNKS = CHUNK_SIZE; // Cap RAM usage (~20-40MB max)
  private readonly TTL_MS = 1000 * 60 * 10; // 10 minutes inactive eviction

  constructor() {
    this.startCleanupLoop();
  }

  init(world: World) {
    this.world = world;
  }

  private buildCacheKey(zone: Zone, chunkKey: string): string {
    return `${zone.areaId}:${zone.name}:${chunkKey}`;
  }

  /**
   * 🟢 O(1) Instant RAM Read (Main Tick Thread)
   * - Returns Chunk data if cached
   * - Returns null if explicitly confirmed missing on disk
   * - Returns undefined on a true cache miss (needs fetching)
   */
  public getChunkSync(zone: Zone, chunkKey: string): Chunk | null | undefined {
    const key = this.buildCacheKey(zone, chunkKey);
    const entry = this.cache.get(key);

    if (entry) {
      entry.lastAccessed = Date.now();
      return entry.data;
    }

    return undefined; // Cache miss
  }

  /**
   * 🟢 Background Disk Reader
   * Loads chunk into RAM off the main thread and returns it.
   */
  public async fetchAndCacheChunk(
    zone: Zone,
    chunkKey: string
  ): Promise<Chunk | null> {
    const key = this.buildCacheKey(zone, chunkKey);

    // 1. Check RAM cache again
    const hit = this.getChunkSync(zone, chunkKey);
    if (hit !== undefined) return hit; // Return cached Chunk OR cached null

    // 2. Return active read if already in-flight (prevents duplicate disk reads)
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // 3. Queue non-blocking disk read
    const loadPromise = this.readChunkFromDisk(zone, chunkKey)
      .then((chunk) => {
        this.enforceMemoryCap();
        // 🟢 Cache even if null to prevent hammering disk on out-of-bounds chunks!
        this.cache.set(key, {
          data: chunk ?? null,
          lastAccessed: Date.now(),
        });
        return chunk ?? null;
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

    if (isNaN(gridX) || isNaN(gridY)) return undefined;

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
      // 🟢 Silently return undefined so negative cache handles it smoothly
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
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
          if (now - entry.lastAccessed > this.TTL_MS) {
            this.cache.delete(key);
          }
        }
      },
      1000 * 60 * 5
    );
  }
}
