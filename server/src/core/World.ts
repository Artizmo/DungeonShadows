import { readFile } from "node:fs/promises";
import Area from "~/core/Area";
import type Character from "~/core/Character";
import MapCache, { type PreChunkedMap } from "~/core/MapCache";
import { Log } from "~/shared/core/Logger";
import type Zone from "./Zone";

export default class World {
  name: string;
  areas = new Map<string, Area>();
  characters = new Map<number, Character>();
  mapCache: MapCache = new MapCache();
  private readonly CHUNK_SIZE = 256;

  async initialize(configFilePath: string) {
    Log.WORLD.INFO(`Reading configuration from ${configFilePath}...`);

    try {
      const rawData = await readFile(configFilePath, "utf-8");
      const { name, areas } = JSON.parse(rawData);
      this.name = name;

      Log.WORLD.INFO("Initializing world architecture layers...");

      for (const { areaPath } of areas) {
        const areaData = JSON.parse(
          await readFile(`../shared/data/world/areas/${areaPath}`, "utf-8"),
        );
        const area = new Area(areaData);
        await area.initialize(areaData.zones);

        this.areas.set(areaData.id, area);
      }
    } catch (error) {
      Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    }
  }

  /**
   * Executes the pipeline: Coordinates -> Bucket -> Intersect Viewport -> Add Buffer -> Sync Chunks
   * Runs in O(1) mathematical lookup time and O(A) spatial rendering time.
   */
  public async handleCharacterSpatialUpdate(
    character: Character,
    bufferRadius: number = 1,
  ): Promise<{
    zone: Zone;
    toLoadChunks: PreChunkedMap[];
    toUnloadKeys: string[];
    currentBucketKey: string;
  }> {
    const zone = this.areas
      .get(character.zone.areaId)
      .getZone(character.zone.id);

    // 1. Get bucket that contains character's position
    const currentBucketX = Math.floor(character.position.x / this.CHUNK_SIZE);
    const currentBucketY = Math.floor(character.position.y / this.CHUNK_SIZE);
    const currentBucketKey = `${currentBucketX}_${currentBucketY}`;

    // Track dynamic bucket migrations on the Zone
    if (character.currentBucketKey !== currentBucketKey) {
      if (character.currentBucketKey) {
        const oldBucket = zone.buckets.get(character.currentBucketKey);
        if (oldBucket) oldBucket.entities.delete(character.id);
      }
      const newBucket = zone.buckets.get(currentBucketKey);
      if (newBucket) newBucket.entities.add(character.id);

      character.currentBucketKey = currentBucketKey;
    }

    // 2 & 3. Get intersecting camera buckets (Math.floor for min, Math.ceil for max) + buffer
    const startBucketX = Math.max(
      0,
      Math.floor(character.cameraMinX / this.CHUNK_SIZE) - bufferRadius,
    );
    const endBucketX = Math.min(
      Math.ceil(zone.map.width / this.CHUNK_SIZE) - 1,
      Math.ceil(character.cameraMaxX / this.CHUNK_SIZE) + bufferRadius, // 🟢 Removed the "- 1"
    );
    const startBucketY = Math.max(
      0,
      Math.floor(character.cameraMinY / this.CHUNK_SIZE) - bufferRadius,
    );
    const endBucketY = Math.min(
      Math.ceil(zone.map.height / this.CHUNK_SIZE) - 1,
      Math.ceil(character.cameraMaxY / this.CHUNK_SIZE) + bufferRadius, // 🟢 Removed the "- 1"
    );

    // 4. Gather the entire active Area of Interest (AOI) set
    const currentAOI = new Set<string>();
    for (let x = startBucketX; x <= endBucketX; x++) {
      for (let y = startBucketY; y <= endBucketY; y++) {
        currentAOI.add(`${x}_${y}`);
      }
    }

    // 5. Delta Calculations: Only send changes over the websocket
    const toUnloadKeys: string[] = [];
    const toLoadKeys: string[] = [];

    // Find buckets the player has walked away from
    for (const key of character.activeAOI) {
      if (!currentAOI.has(key)) toUnloadKeys.push(key);
    }

    // Find brand new buckets entering the viewport bounds
    for (const key of currentAOI) {
      if (!character.activeAOI.has(key)) toLoadKeys.push(key);
    }

    // Commit the new AOI state to character memory
    character.activeAOI = currentAOI;

    // Decrement viewport counters for retired buckets
    for (const bucketKey of toUnloadKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) bucket.userCount--;
    }

    // Fetch and prepare WebP texture data for incoming buckets
    const toLoadChunks: PreChunkedMap[] = [];
    for (const bucketKey of toLoadKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) {
        bucket.userCount++;

        const chunkData = await this.mapCache.getChunk(zone, bucketKey);
        if (chunkData) {
          toLoadChunks.push(chunkData);
        }
      }
    }

    // 6. Return delta state to the handler to emit to the client
    return {
      toLoadChunks,
      toUnloadKeys,
      zone,
      currentBucketKey,
    };
  }

  add(character: Character): void {
    this.characters.set(character.id, character);
  }
}
