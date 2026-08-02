import { CHUNK_SIZE, MAX_ENTITIES_PER_BUCKET } from "~/shared/core/constants";
import type { ICamera, Vector2D } from "~/shared/core/types";

export default class Zone {
  public id: string;
  public name: string;
  public areaId: string;
  public map: {
    width: number;
    height: number;
    file: string;
    totalChunks: number;
    lastProcessedDate: Date;
  };

  public cols: number = 0;
  public rows: number = 0;
  public totalBuckets: number = 0;

  // --- FLAT MEMORY (Allocated once per zone instance) ---
  public readonly bucketEntities: Int32Array;
  public readonly bucketEntityCounts: Int32Array;
  public readonly bucketUserCounts: Int32Array;

  constructor(zoneData: Partial<Zone>) {
    this.id = zoneData.id!;
    this.name = zoneData.name!;
    this.areaId = zoneData.areaId!;
    this.map = { ...zoneData.map! };

    this.cols = Math.ceil(this.map.width / CHUNK_SIZE);
    this.rows = Math.ceil(this.map.height / CHUNK_SIZE);
    this.totalBuckets = this.cols * this.rows;

    // Direct TypedArray allocations — simple, clean, zero complex pool math!
    this.bucketEntities = new Int32Array(
      this.totalBuckets * MAX_ENTITIES_PER_BUCKET
    ).fill(-1);
    this.bucketEntityCounts = new Int32Array(this.totalBuckets).fill(0);
    this.bucketUserCounts = new Int32Array(this.totalBuckets).fill(0);
  }

  // --- FAST NUMERIC SPATIAL LOOKUPS (Zero Strings!) ---

  public getBucketIndexByCoords(x: number, y: number): number {
    const col = (x / 256) | 0;
    const row = (y / 256) | 0;

    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return -1;

    return col + row * this.cols;
  }

  // --- ZERO-GC SPATIAL MUTATIONS ---

  public addEntity(bucketIndex: number, entityId: number): void {
    if (bucketIndex < 0 || bucketIndex >= this.totalBuckets) return;

    const count = this.bucketEntityCounts[bucketIndex];
    if (count >= MAX_ENTITIES_PER_BUCKET) return;

    const offset = bucketIndex * MAX_ENTITIES_PER_BUCKET + count;
    this.bucketEntities[offset] = entityId;
    this.bucketEntityCounts[bucketIndex]++;
  }

  public removeEntity(bucketIndex: number, entityId: number): void {
    if (bucketIndex < 0 || bucketIndex >= this.totalBuckets) return;

    const count = this.bucketEntityCounts[bucketIndex];
    const baseOffset = bucketIndex * MAX_ENTITIES_PER_BUCKET;

    for (let i = 0; i < count; i++) {
      if (this.bucketEntities[baseOffset + i] === entityId) {
        // Swap-and-Pop O(1)
        const lastEntityId = this.bucketEntities[baseOffset + count - 1];
        this.bucketEntities[baseOffset + i] = lastEntityId;
        this.bucketEntities[baseOffset + count - 1] = -1;
        this.bucketEntityCounts[bucketIndex]--;
        return;
      }
    }
  }
}
