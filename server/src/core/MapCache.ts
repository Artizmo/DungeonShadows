import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { Log } from "~/shared/core/Logger.js";
import type Zone from "~/core/Zone";

export interface PreChunkedMap {
  x: number;
  y: number;
  textureBytes: Uint8Array;
}

interface CacheEntry {
  chunks: Map<string, PreChunkedMap>;
  lastAccessed: number;
  fileName: string;
}

export default class MapCache {
  private cache = new Map<string, CacheEntry>();
  private readonly chunkSize = 256;

  // Configuration settings
  private readonly ttlMs = 1000 * 60 * 30; // 30 Minutes of inactivity
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupLoop();
  }

  /**
   * 1. Core Synchronizer & Reader (Combines checking and fetching)
   * Replacing your old getAllZoneChunks with an async data stream guarantee
   */
  public async getZoneMapChunks(zone: Zone): Promise<PreChunkedMap[]> {
    let entry = this.cache.get(zone.id);

    if (entry) {
      Log.DATA.INFO(`💾 Fetching Zone ${zone.id} from MapCache!`);
    }

    // 🟢 Cache Miss: Load from hard drive seamlessly if not present or expired
    if (!entry) {
      Log.DATA.INFO(`🔍 Zone ${zone.id} not found in MapCache.`);
      Log.DATA.INFO(`Fetching zone...`);
      await this.fetchZone(zone);
      entry = this.cache.get(zone.id);
    }

    if (!entry) return [];

    entry.lastAccessed = Date.now(); // Touch tracking timestamp
    return Array.from(entry.chunks.values());
  }

  /**
   * 1.5. O(1) Key-Based Chunk Reader
   * Fetches only the single, specific coordinate slice needed for AOI loading
   */
  public async getChunk(
    zone: Zone,
    chunkKey: string,
  ): Promise<PreChunkedMap | undefined> {
    let entry = this.cache.get(zone.id);

    // 🟢 Cache Miss: Load and slice the entire zone if it's not already in memory
    if (!entry) {
      Log.DATA.INFO(
        `🔍 Zone ${zone.id} cache miss for chunk [${chunkKey}]. Loading full map...`,
      );
      await this.fetchZone(zone);
      entry = this.cache.get(zone.id);
    }

    if (!entry) return undefined;

    entry.lastAccessed = Date.now(); // Reset inactivity timer
    return entry.chunks.get(chunkKey); // O(1) direct bucket lookup
  }

  /**
   * 2. The Heavy Lifting (Slicing raw file bytes)
   */
  private async fetchZone(zone: Zone): Promise<void> {
    const zoneGrid = new Map<string, PreChunkedMap>();
    const mapPath = path.resolve(
      process.cwd(),
      `../shared/data/world/areas/${zone.areaId}/zones/${zone.mapName}.webp`,
    );

    try {
      const imageBuffer = await fs.readFile(mapPath);
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      for (let y = 0; y < height; y += this.chunkSize) {
        for (let x = 0; x < width; x += this.chunkSize) {
          const chunkX = x / this.chunkSize;
          const chunkY = y / this.chunkSize;

          const croppedBuffer = await sharp(imageBuffer)
            .extract({
              left: x,
              top: y,
              width: Math.min(this.chunkSize, width - x),
              height: Math.min(this.chunkSize, height - y),
            })
            .toBuffer();

          zoneGrid.set(`${chunkX}_${chunkY}`, {
            x: chunkX,
            y: chunkY,
            textureBytes: new Uint8Array(croppedBuffer),
          });
        }
      }

      // 🟢 FIX: Set key using zone.id to match your retrieval queries!
      this.cache.set(zone.id, {
        chunks: zoneGrid,
        lastAccessed: Date.now(),
        fileName: mapPath,
      });

      Log.DATA.INFO(`💾 Zone ${zone.id} successfully cached.`);
    } catch (error) {
      Log.DATA.ERROR(
        `❌ Failed loading map for zone ${zone.id}. Error: ${error}`,
      );
    }
  }

  /**
   * 3. CONTROL: Force Stale
   */
  public forceStale(zoneId: string): void {
    if (this.cache.has(zoneId)) {
      this.cache.delete(zoneId);
      Log.DATA.INFO(`♻️ Zone ${zoneId} manually purged (marked stale).`);
    }
  }

  /**
   * 4. AUTOMATION: Active Inactivity Cleaner
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();

        for (const [zoneId, entry] of this.cache.entries()) {
          if (now - entry.lastAccessed > this.ttlMs) {
            this.cache.delete(zoneId);
            Log.DATA.INFO(`🧹 Zone ${zoneId} evicted due to inactivity.`);
          }
        }
      },
      1000 * 60 * 5, // Run every 5 minutes
    );
  }

  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Export the single active instance directly
export const mapCache = new MapCache();
