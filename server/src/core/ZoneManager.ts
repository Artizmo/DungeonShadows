import MapManager, { type Chunk } from "~/core/MapManager";
import {
  CHUNK_SIZE,
  MAX_BUCKETS,
  MAX_CHARACTERS,
  MAX_ENTITIES_PER_BUCKET,
  SHARED_ROOT_PATH,
} from "~/shared/core/constants";

import type Area from "~/core/Area";
import type Zone from "~/core/Zone";
import type Character from "~/core/Character";

export default class ZoneManager {
  public areas = new Map<string, Area>();
  public zones = new Map<string, Zone>();
  public mapManager = new MapManager();

  // 🟢 Decoupled Event Hook (Wired by World constructor)
  public onChunksLoaded?: (character: Character) => void;

  // 🟢 Active Bucket Tracking (20Hz Simulation Loop Targets)
  public readonly activeBuckets = new Int32Array(MAX_BUCKETS);
  public activeBucketCount = 0;
  private readonly bucketObserverCounts = new Int32Array(MAX_BUCKETS);

  // 🟢 Pre-allocated AOI camera view buffers
  private readonly AOIBuckets = new Int32Array(MAX_CHARACTERS * MAX_BUCKETS);
  private readonly AOIBucketCount = new Int32Array(MAX_CHARACTERS);

  // 🟢 Loaded Chunk Keys per character
  private readonly loadedCharacterChunks = new Map<number, Set<number>>();

  // 🟢 Zero-GC Scratch Buffer for Async Chunk Loading
  private readonly scratchChunkKeys = new Int32Array(MAX_BUCKETS);

  // ==========================================
  // AOI REGISTRATION
  // ==========================================

  public register(character: Character): void {
    const zone = this.getZone(character.zoneId);

    if (this.AOIBucketCount[character.id] > 0) {
      this.unregisterObserversOnly(character, zone);
    }

    this.getZoneAOIBuckets(character, zone);
  }

  public unregister(character: Character): void {
    if (this.AOIBucketCount[character.id] === 0) return;

    const zone = this.zones.get(character.zoneId);
    if (zone) {
      this.unregisterObserversOnly(character, zone);
    } else {
      this.AOIBucketCount[character.id] = 0;
    }

    this.loadedCharacterChunks.delete(character.id);
  }

  private unregisterObserversOnly(character: Character, zone: Zone): void {
    const charId = character.id;
    const count = this.AOIBucketCount[charId];
    const baseOffset = charId * MAX_BUCKETS;

    for (let i = 0; i < count; i++) {
      const packedBucketId = this.AOIBuckets[baseOffset + i];
      const bx = (packedBucketId >>> 16) & 0xffff;
      const by = packedBucketId & 0xffff;

      const bucketIdx = by * zone.cols + bx;
      if (bucketIdx >= 0 && bucketIdx < zone.totalBuckets) {
        this.removeObserver(bucketIdx);
      }
    }

    this.AOIBucketCount[charId] = 0;
  }

  // ==========================================
  // AOI QUERIES — O(A) AREA OF INTEREST ITERATION
  // ==========================================

  public forEachVisibleEntity(
    character: Character,
    callback: (entityId: number) => void
  ): void {
    const charId = character.id;
    const count = this.AOIBucketCount[charId];
    if (count === 0) return;

    const zone = this.zones.get(character.zoneId);
    if (!zone) return;

    const baseOffset = charId * MAX_BUCKETS;

    for (let i = 0; i < count; i++) {
      const packedBucketId = this.AOIBuckets[baseOffset + i];

      const bx = (packedBucketId >>> 16) & 0xffff;
      const by = packedBucketId & 0xffff;

      const bucketIndex = by * zone.cols + bx;
      if (bucketIndex < 0 || bucketIndex >= zone.totalBuckets) continue;

      const entityCount = zone.bucketEntityCounts[bucketIndex];
      const bucketBaseOffset = bucketIndex * MAX_ENTITIES_PER_BUCKET;

      for (let j = 0; j < entityCount; j++) {
        const entityId = zone.bucketEntities[bucketBaseOffset + j];

        if (entityId !== charId && entityId !== -1) {
          callback(entityId);
        }
      }
    }
  }

  // ==========================================
  // SPATIAL PLACEMENT & MOVEMENT (O(1) ZERO-GC)
  // ==========================================

  public spawnEntity(id: number, x: number, y: number, zoneId: string): void {
    const zone = this.getZone(zoneId);
    const bucketIdx = this.getBucketIndex(x, y, zone);
    const count = zone.bucketEntityCounts[bucketIdx];

    if (count >= MAX_ENTITIES_PER_BUCKET) {
      console.warn(`Bucket ${bucketIdx} in zone ${zoneId} is full!`);
      return;
    }

    const baseOffset = bucketIdx * MAX_ENTITIES_PER_BUCKET;
    zone.bucketEntities[baseOffset + count] = id;
    zone.bucketEntityCounts[bucketIdx]++;
  }

  public despawnEntity(id: number, x: number, y: number, zoneId: string): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    const bucketIdx = this.getBucketIndex(x, y, zone);
    const count = zone.bucketEntityCounts[bucketIdx];
    const baseOffset = bucketIdx * MAX_ENTITIES_PER_BUCKET;

    for (let i = 0; i < count; i++) {
      if (zone.bucketEntities[baseOffset + i] === id) {
        const lastEntityId = zone.bucketEntities[baseOffset + count - 1];
        zone.bucketEntities[baseOffset + i] = lastEntityId;
        zone.bucketEntities[baseOffset + count - 1] = -1;
        zone.bucketEntityCounts[bucketIdx]--;
        break;
      }
    }
  }

  /**
   * 🟢 O(1) Zero-GC bucket transfer when entities move across grid boundaries.
   */
  public updateEntityPosition(
    entityId: number,
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    zoneId: string
  ): void {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    const oldBucketIdx = this.getBucketIndex(oldX, oldY, zone);
    const newBucketIdx = this.getBucketIndex(newX, newY, zone);

    if (oldBucketIdx === newBucketIdx) return;

    // 1. Swap-and-pop removal from old bucket
    const oldBase = oldBucketIdx * MAX_ENTITIES_PER_BUCKET;
    const oldCount = zone.bucketEntityCounts[oldBucketIdx];

    for (let i = 0; i < oldCount; i++) {
      if (zone.bucketEntities[oldBase + i] === entityId) {
        zone.bucketEntities[oldBase + i] =
          zone.bucketEntities[oldBase + oldCount - 1];
        zone.bucketEntities[oldBase + oldCount - 1] = -1;
        zone.bucketEntityCounts[oldBucketIdx]--;
        break;
      }
    }

    // 2. Append to new bucket
    const newCount = zone.bucketEntityCounts[newBucketIdx];
    if (newCount < MAX_ENTITIES_PER_BUCKET) {
      const newBase = newBucketIdx * MAX_ENTITIES_PER_BUCKET;
      zone.bucketEntities[newBase + newCount] = entityId;
      zone.bucketEntityCounts[newBucketIdx]++;
    } else {
      console.warn(
        `Bucket ${newBucketIdx} full during move for entity ${entityId}`
      );
    }
  }

  // ==========================================
  // CHUNK PRE-FETCH
  // ==========================================
  private async ensureAOIChunksLoaded(
    character: Character,
    zone: Zone,
    chunkCount: number
  ): Promise<void> {
    let charChunkSet = this.loadedCharacterChunks.get(character.id);
    if (!charChunkSet) {
      charChunkSet = new Set<number>();
      this.loadedCharacterChunks.set(character.id, charChunkSet);
    }

    let newlyLoadedAny = false;

    const chunkPath = `${SHARED_ROOT_PATH}/${zone.areaId}/zones/${zone.name.toLocaleLowerCase()}/chunks`;

    for (let i = 0; i < chunkCount; i++) {
      const chunkKey = this.scratchChunkKeys[i];
      if (charChunkSet.has(chunkKey)) continue;

      const cacheKey = `${zone.areaId}:${zone.id}:${chunkKey}`;
      const chunk = await this.mapManager.fetchAndCacheChunkByKey(
        chunkPath,
        chunkKey,
        cacheKey
      );

      if (chunk) {
        charChunkSet.add(chunkKey);
        newlyLoadedAny = true;
      }
    }

    if (newlyLoadedAny) {
      this.onChunksLoaded?.(character);
    }
  }

  // ==========================================
  // OBSERVER TRACKING & AOI COMPUTATION
  // ==========================================

  public addObserver(bucketIdx: number): void {
    const prevCount = this.bucketObserverCounts[bucketIdx]++;
    if (prevCount === 0) {
      this.activeBuckets[this.activeBucketCount++] = bucketIdx;
    }
  }

  public removeObserver(bucketIdx: number): void {
    const newCount = --this.bucketObserverCounts[bucketIdx];
    if (newCount === 0) {
      for (let i = 0; i < this.activeBucketCount; i++) {
        if (this.activeBuckets[i] === bucketIdx) {
          this.activeBuckets[i] = this.activeBuckets[--this.activeBucketCount];
          break;
        }
      }
    }
  }

  public getZoneAOIBuckets(character: Character, zone: Zone): void {
    const position = character.transform.position;
    const camera = character.camera;
    const bufferRadius = 2;

    const halfW = camera.width / 2;
    const halfH = camera.height / 2;

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
        const packedBucketId = (((bx & 0xffff) << 16) | (by & 0xffff)) >>> 0;

        const bucketIdx = by * zone.cols + bx;
        this.addObserver(bucketIdx);

        this.AOIBuckets[baseOffset + count] = packedBucketId;
        this.scratchChunkKeys[count] = packedBucketId;
        count++;
      }
    }
    this.AOIBucketCount[character.id] = count;

    this.ensureAOIChunksLoaded(character, zone, count);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  public getBucketIndex(x: number, y: number, zone: Zone): number {
    const bx = Math.max(0, Math.min(zone.cols - 1, Math.floor(x / CHUNK_SIZE)));
    const by = Math.max(0, Math.min(zone.rows - 1, Math.floor(y / CHUNK_SIZE)));
    return by * zone.cols + bx;
  }

  public getZone(zoneId: string): Zone {
    const zone = this.zones.get(zoneId);
    if (!zone) throw new Error(`Bad zoneId (${zoneId})`);
    return zone;
  }
}
