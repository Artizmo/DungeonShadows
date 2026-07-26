import type Npc from "./Npc";

export interface Bucket {
  id: string;
  entities: Set<number>; // Set of Character/Entity IDs inside this specific cell
  staticObjects: any[]; // Colliders, interactables, or specific tile data
  userCount: number; // Ref-count: How many player viewports overlap this bucket
}

export default class Zone {
  id: string;
  name: string;
  areaId: string;
  map: {
    width: number;
    height: number;
    file: string;
    totalChunks: number;
    lastProcessedDate: Date;
  };
  cols: number = 0;
  rows: number = 0;
  buckets: Map<string, Bucket>;

  constructor(zone: Zone) {
    this.id = zone.id;
    this.name = zone.name;
    this.areaId = zone.areaId;
    this.map = { ...zone.map };
    this.buckets = new Map();
  }

  /**
   * Generates the 256x256 pixel abstract spatial partition grid.
   * This partitions the map vectors without loading any actual images into RAM.
   */
  public async initBucketGrid(): Promise<void> {
    this.cols = Math.ceil(this.map.width / 256);
    this.rows = Math.ceil(this.map.height / 256);

    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const id = `${x}_${y}`;
        this.buckets.set(id, {
          id,
          entities: new Set<number>(),
          staticObjects: [],
          userCount: 0,
        });
      }
    }
  }

  getBucket(key: string): Bucket {
    if (!key) return;

    return this.buckets.get(key);
  }

  getBucketIdByCoords(x: number, y: number): string {
    if (!x || !y) return;

    return `${Math.floor(x / 256)}_${Math.floor(y / 256)}`;
  }

  getBucketByCoords(x: number, y: number): Bucket {
    const bucketId = this.getBucketIdByCoords(x, y);
    if (!bucketId) return;

    return this.buckets.get(bucketId);
  }
}
