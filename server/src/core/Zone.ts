export interface Bucket {
  key: string;
  entities: Set<number>; // Set of Character/Entity IDs inside this specific cell
  staticObjects: any[]; // Colliders, interactables, or specific tile data
  userCount: number; // Ref-count: How many player viewports overlap this bucket
}

export default class Zone {
  id: string;
  name: string;
  areaId: string;
  mapName: string;
  map: {
    width: number;
    height: number;
    file: string;
    totalChunks: number;
    lastProcessedDate: Date;
  };
  userCount = 0;
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
        const key = `${x}_${y}`;
        this.buckets.set(key, {
          key,
          entities: new Set<number>(),
          staticObjects: [],
          userCount: 0,
        });
      }
    }
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
