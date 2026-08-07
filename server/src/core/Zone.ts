import { CHUNK_SIZE, MAX_ENTITIES_PER_BUCKET } from "~/shared/core/constants";

export interface MapMetaData {
  width: number;
  height: number;
  file: string;
  totalChunks: number;
  lastProcessedDate: Date;
}

const DEFAULT_MAP: Readonly<MapMetaData> = Object.freeze({
  width: 0,
  height: 0,
  file: "",
  totalChunks: 0,
  lastProcessedDate: new Date(0),
});

export default class Zone {
  public id: string;
  public name: string;
  public areaId: string;
  public map: MapMetaData;

  public readonly cols: number;
  public readonly rows: number;
  public readonly totalBuckets: number;

  // --- FLAT MEMORY (Allocated once per zone instance) ---
  public readonly bucketEntities: Int32Array;
  public readonly bucketEntityCounts: Int32Array;

  constructor(zoneData: Partial<Zone>) {
    this.id = zoneData.id ?? "";
    this.name = zoneData.name ?? "";
    this.areaId = zoneData.areaId ?? "";
    this.map = zoneData.map ? { ...zoneData.map } : { ...DEFAULT_MAP };

    this.cols = Math.ceil(this.map.width / CHUNK_SIZE);
    this.rows = Math.ceil(this.map.height / CHUNK_SIZE);
    this.totalBuckets = this.cols * this.rows;

    // Guaranteed 0-GC allocations
    this.bucketEntities = new Int32Array(
      this.totalBuckets * MAX_ENTITIES_PER_BUCKET
    ).fill(-1);
    this.bucketEntityCounts = new Int32Array(this.totalBuckets); // Guaranteed 0-filled by JS spec
  }

  // --- FAST NUMERIC SPATIAL LOOKUPS (0 Strings, 0 Allocations) ---

  public getBucketIndexByCoords(x: number, y: number): number {
    const col = (x / CHUNK_SIZE) | 0;
    const row = (y / CHUNK_SIZE) | 0;

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
    this.bucketEntityCounts[bucketIndex] = count + 1;
  }

  public removeEntity(bucketIndex: number, entityId: number): void {
    if (bucketIndex < 0 || bucketIndex >= this.totalBuckets) return;

    const count = this.bucketEntityCounts[bucketIndex];
    const baseOffset = bucketIndex * MAX_ENTITIES_PER_BUCKET;

    for (let i = 0; i < count; i++) {
      if (this.bucketEntities[baseOffset + i] === entityId) {
        // Swap-and-Pop O(1)
        const lastIdx = baseOffset + count - 1;
        this.bucketEntities[baseOffset + i] = this.bucketEntities[lastIdx];
        this.bucketEntities[lastIdx] = -1;
        this.bucketEntityCounts[bucketIndex] = count - 1;
        return;
      }
    }
  }
}
