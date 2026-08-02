import MapManager, { type Chunk } from "~/core/MapManager";
import StateManager from "~/core/StateManager";
import {
  CHUNK_SIZE,
  MAX_BUCKETS,
  MAX_CHARACTERS,
} from "~/shared/core/constants";

import type Area from "~/core/Area";
import type Zone from "~/core/Zone";
import type Character from "~/core/Character";

export default class ZoneManager {
  public areas = new Map<string, Area>();
  public zones = new Map<string, Zone>();
  public mapManager = new MapManager();
  private state = new StateManager();

  // 🟢 1. Flat TypedArrays for 0 GC execution
  private AOIBuckets = new Int32Array(MAX_CHARACTERS * MAX_BUCKETS);
  private AOIBucketCount = new Int32Array(MAX_CHARACTERS);
  private readonly chunkResultBuffer: Chunk[] = Array.from(
    { length: MAX_BUCKETS },
    () => ({
      x: 0,
      y: 0,
      textureBytes: new Uint8Array(0),
    })
  );

  public async initializeAOI(character: Character): Promise<void> {
    this.calculateAOI(character);
    const bucketKeys = this.getCharacterAOIBucketKeys(character.id);
    const chunks = await this.getZoneChunks(character.zoneId, bucketKeys);

    console.log(`Character ${character.name} zone chunks:`, chunks);
  }

  public async getZoneChunks(
    zoneId: string,
    bucketKeys: string[]
  ): Promise<Chunk[]> {
    const zone = this.getZone(zoneId);
    if (!zone) throw new Error(`Zone not found: ${zoneId}!`);

    const chunks: Chunk[] = [];

    for (const key of bucketKeys) {
      chunks.push(await this.mapManager.fetchAndCacheChunk(zone, key));
    }

    return chunks;
  }

  public async calculateAOI(character: Character): Promise<void> {
    const position = character.transform.position;
    const camera = character.camera;
    const zone = this.getZone(character.zoneId);
    const bufferRadius = 2;

    const halfW = camera.width / 2;
    const halfH = camera.height / 2;

    // 🟢 2. Calculate maximum valid chunk coordinates (supports up to 65,535 chunks)
    const maxBucketX = Math.min(
      65535,
      Math.max(0, Math.floor((zone.map.width - 1) / CHUNK_SIZE))
    );
    const maxBucketY = Math.min(
      65535,
      Math.max(0, Math.floor((zone.map.height - 1) / CHUNK_SIZE))
    );

    const minX = Math.max(0, position.x - halfW);
    const maxX = Math.min(zone.map.width, position.x + halfW);
    const minY = Math.max(0, position.y - halfH);
    const maxY = Math.min(zone.map.height, position.y + halfH);

    const startBucketX = Math.floor(minX / CHUNK_SIZE) - bufferRadius;
    const endBucketX = Math.floor(maxX / CHUNK_SIZE) + bufferRadius;
    const startBucketY = Math.floor(minY / CHUNK_SIZE) - bufferRadius;
    const endBucketY = Math.floor(maxY / CHUNK_SIZE) + bufferRadius;

    const clampedStartX = Math.max(0, startBucketX);
    const clampedEndX = Math.min(maxBucketX, endBucketX);
    const clampedStartY = Math.max(0, startBucketY);
    const clampedEndY = Math.min(maxBucketY, endBucketY);

    const baseOffset = character.id * MAX_BUCKETS;
    let count = 0;

    for (let bx = clampedStartX; bx <= clampedEndX; bx++) {
      for (let by = clampedStartY; by <= clampedEndY; by++) {
        // 🟢 3. Bit-pack X (top 16 bits) and Y (bottom 16 bits).
        // (bx & 0xFFFF) << 16 extracts up to chunk index 65,535.
        // >>> 0 forces JavaScript to treat the result as an unsigned 32-bit integer.
        const bucketId = (((bx & 0xffff) << 16) | (by & 0xffff)) >>> 0;

        this.AOIBuckets[baseOffset + count++] = bucketId;
      }
    }

    this.AOIBucketCount[character.id] = count;
  }

  /**
   * Generates string array of AOI bucket keys ("0_0", "0_1") for a specific character.
   * Call this only when serializing network packets or logging.
   */
  public getCharacterAOIBucketKeys(characterId: number): string[] {
    const count = this.AOIBucketCount[characterId];
    const baseOffset = characterId * MAX_BUCKETS;

    // Allocate the output array sized exactly to active buckets
    const keys = new Array<string>(count);

    for (let i = 0; i < count; i++) {
      const bucketId = this.AOIBuckets[baseOffset + i];

      // Unpack 16-bit X and Y coordinates
      const x = (bucketId >>> 16) & 0xffff;
      const y = bucketId & 0xffff;

      keys[i] = `${x}_${y}`;
    }

    return keys;
  }

  /**
   * 🟢 4. Unpack helper method (Zero allocation)
   * Use this anywhere in your server logic to extract chunk X and Y.
   */
  public unpackBucketId(bucketId: number, out: { x: number; y: number }): void {
    out.x = (bucketId >>> 16) & 0xffff;
    out.y = bucketId & 0xffff;
  }

  public getZone(zoneId: string): Zone {
    const zone = this.zones.get(zoneId);
    if (!zone) throw `Bad zoneId (${zoneId})`;

    return zone;
  }
}
