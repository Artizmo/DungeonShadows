// server/maps/MapCache.ts
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { Zone } from "~/core/types";

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

export class MapCache {
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

    // 🟢 Cache Miss: Load from hard drive seamlessly if not present or expired
    if (!entry) {
      console.log(
        `🔍 MapCache miss for zone "${zone.id}". Fetching from disk...`,
      );
      await this.fetchZone(zone);
      entry = this.cache.get(zone.id);
    }

    if (!entry) return [];

    entry.lastAccessed = Date.now(); // Touch tracking timestamp
    return Array.from(entry.chunks.values());
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

      console.log(`💾 Zone "${zone.id}" successfully cached.`);
    } catch (error) {
      console.error(`❌ Failed loading map for zone: ${zone.id}`, error);
    }
  }

  /**
   * 3. CONTROL: Force Stale
   */
  public forceStale(zoneId: string) {
    if (this.cache.has(zoneId)) {
      this.cache.delete(zoneId);
      console.log(`♻️ Zone "${zoneId}" manually purged (marked stale).`);
    }
  }

  /**
   * 4. AUTOMATION: Active Inactivity Cleaner
   */
  private startCleanupLoop() {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();

        for (const [zoneId, entry] of this.cache.entries()) {
          if (now - entry.lastAccessed > this.ttlMs) {
            this.cache.delete(zoneId);
            console.log(`🧹 Zone "${zoneId}" evicted due to inactivity.`);
          }
        }
      },
      1000 * 60 * 5,
    );
  }

  public shutdown() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }
}
