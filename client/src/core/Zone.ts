import { Log } from "~/shared/core/Logger";

export interface Bucket {
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
  userCount = 0;

  // Key: "X_Y" (e.g., "0_0", "3_4"), Value: Spatial Bucket state
  buckets: Map<string, Bucket>;

  constructor(zone: Zone) {
    this.id = zone.id;
    this.name = zone.name;
    this.areaId = zone.areaId;
    this.map = { ...zone.map };
    this.buckets = { ...zone.buckets };
    this.userCount = zone.userCount;
  }

  /**
   * Generates the 256x256 pixel abstract spatial partition grid.
   * This partitions the map vectors without loading any actual images into RAM.
   */
  public async initBucketGrid(): Promise<void> {
    const cols = Math.ceil(this.map.width / 256);
    const rows = Math.ceil(this.map.height / 256);

    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        this.buckets.set(`${x}_${y}`, {
          entities: new Set<number>(),
          staticObjects: [],
          userCount: 0,
        });
      }
    }

    Log.WORLD.INFO(
      `[Zone: ${this.id}] Grid generated: ${cols}x${rows} (${this.buckets.size} buckets total).`,
    );
  }

  /**
   * O(1) mathematical lookup to fetch a bucket by its grid coordinates.
   */
  public getBucket(x: number, y: number): Bucket | undefined {
    return this.buckets.get(`${x}_${y}`);
  }

  /**
   * Helper to fetch a bucket directly using raw pixel coordinates.
   */
  public getBucketByPixels(pixelX: number, pixelY: number): Bucket | undefined {
    const bucketX = Math.floor(pixelX / 256);
    const bucketY = Math.floor(pixelY / 256);
    return this.getBucket(bucketX, bucketY);
  }
}
