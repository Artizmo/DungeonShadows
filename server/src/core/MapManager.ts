import fs from "node:fs/promises";
import path from "node:path";
import { SHARED_ROOT_PATH } from "~/shared/core/constants";

export interface Chunk {
  x: number;
  y: number;
  textureBytes: Uint8Array;
}

export default class MapManager {
  // RAM Cache keyed by "areaId:zoneId:chunkKey"
  private cache = new Map<string, Chunk>();
  private loadingPromises = new Map<string, Promise<Chunk | undefined>>();

  /**
   * Fetches chunk texture using packed integer key or coordinate values.
   */
  public async fetchAndCacheChunkByKey(
    chunkPath: string,
    chunkKey: number,
    cacheKey: string
  ): Promise<Chunk | undefined> {
    // Unpack 16-bit X (top 16 bits) and Y (bottom 16 bits) from integer key
    const bx = (chunkKey >>> 16) & 0xffff;
    const by = chunkKey & 0xffff;

    // 1. RAM Hit
    const hit = this.cache.get(cacheKey);
    if (hit) return hit;

    // 2. In-Flight Dedup
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // 3. Disk Read using bx_by.webp
    const loadPromise = this.readChunkFromDisk(chunkPath, bx, by, cacheKey);
    this.loadingPromises.set(cacheKey, loadPromise);

    return loadPromise;
  }

  private async readChunkFromDisk(
    chunkPath: string,
    bx: number,
    by: number,
    cacheKey: string
  ): Promise<Chunk | undefined> {
    try {
      // Constructs the file name as 0_0.webp
      const fileName = `${bx}_${by}.webp`;

      const filePath = path.resolve(process.cwd(), `${chunkPath}/${fileName}`);

      const fileBuffer = await fs.readFile(filePath);

      const chunk: Chunk = {
        x: bx,
        y: by,
        textureBytes: new Uint8Array(fileBuffer),
      };

      this.cache.set(cacheKey, chunk);
      return chunk;
    } catch (error) {
      console.warn(`[MapManager] Missing chunk file: ${chunkPath}.webp`);
      return undefined;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }
}
