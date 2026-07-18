import fs from "fs/promises";
import path from "path";
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
  // 🟢 Key format: "zoneId:chunkKey" (e.g., "arena:sephus:4_0")
  private cache = new Map<string, ChunkCacheEntry>();

  // Track ongoing disk reads so concurrent requests for the same chunk don't duplicate I/O
  private loadingPromises = new Map<string, Promise<Chunk | undefined>>();

  // Configuration settings
  private readonly ttlMs = 1000 * 60 * 15; // Evict individual chunks after 15 mins of inactivity
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupLoop();
  }

  /**
   * O(1) Lazy-Reader: Only loads the specific chunk requested from disk into RAM.
   */
  public async getChunk(
    zone: Zone,
    chunkKey: string,
  ): Promise<Chunk | undefined> {
    const [strX, strY] = chunkKey.split("_");
    const gridX = parseInt(strX, 10);
    const gridY = parseInt(strY, 10);

    // 🟢 Path to the pre-processed chunk file
    const chunkPath = path.resolve(
      process.cwd(),
      `../shared/data/world/areas/${zone.areaId}/zones/${zone.name}/chunks/${gridX}_${gridY}.webp`,
    );

    try {
      // 🟢 Direct read: No slicing required!
      const fileBuffer = await fs.readFile(chunkPath);

      return {
        x: gridX,
        y: gridY,
        textureBytes: new Uint8Array(fileBuffer),
      };
    } catch (err) {
      Log.DATA.ERROR(`❌ Chunk not found: ${chunkKey}`);
      return undefined;
    }
  }

  // Inside MapCache.ts
  private async readPreprocessedChunkFromDisk(
    zone: Zone,
    chunkKey: string,
  ): Promise<Chunk | undefined> {
    const [strX, strY] = chunkKey.split("_");
    const gridX = parseInt(strX, 10);
    const gridY = parseInt(strY, 10);

    // 🟢 Convert Grid Index to Pixel Offset to find the existing file
    const pixelX = gridX * 256;
    const pixelY = gridY * 256;
    const fileName = `${pixelX}_${pixelY}.webp`;

    const chunkFilePath = path.resolve(
      process.cwd(),
      `../shared/data/world/areas/${zone.areaId}/zones/${zone.name}/chunks/${fileName}`,
    );

    try {
      const fileBuffer = await fs.readFile(chunkFilePath);

      return {
        x: gridX, // Send original grid index so the Renderer can multiply by 256
        y: gridY,
        textureBytes: new Uint8Array(fileBuffer),
      };
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Automatically evicts individual chunks from RAM when players leave the area.
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        let evictedCount = 0;

        for (const [cacheKey, entry] of this.cache.entries()) {
          if (now - entry.lastAccessed > this.ttlMs) {
            this.cache.delete(cacheKey);
            evictedCount++;
          }
        }

        if (evictedCount > 0) {
          Log.WORLD.INFO(
            `🧹 Evicted ${evictedCount} inactive map chunks from RAM.`,
          );
        }
      },
      1000 * 60 * 5,
    ); // Check every 5 minutes
  }

  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

export const mapCache = new MapCache();
