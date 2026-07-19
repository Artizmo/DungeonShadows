import { readFile } from "node:fs/promises";
import Area from "~/core/Area";
import type Character from "~/core/Character";
import MapCache, { type Chunk } from "~/core/MapCache";
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
    chunks: Chunk[];
    unchunks: string[];
    currentBucketKey: string;
  }> {
    const zone = this.areas
      .get(character.zone.areaId)
      .getZone(character.zone.id);

    // 1. Enforce Absolute Map Boundaries for the Character
    // Allows the entity to walk completely off-screen, up to the exact pixel edge of the map
    const entityPadding = 0;
    const minBoundX = entityPadding;
    const minBoundY = entityPadding;
    const maxBoundX = zone.map.width - entityPadding;
    const maxBoundY = zone.map.height - entityPadding;

    if (character.position.x < minBoundX) character.position.x = minBoundX;
    if (character.position.x > maxBoundX) character.position.x = maxBoundX;
    if (character.position.y < minBoundY) character.position.y = minBoundY;
    if (character.position.y > maxBoundY) character.position.y = maxBoundY;

    // 2. Synchronize Grid Buckets
    const currentBucketX = Math.floor(character.position.x / this.CHUNK_SIZE);
    const currentBucketY = Math.floor(character.position.y / this.CHUNK_SIZE);
    const currentBucketKey = `${currentBucketX}_${currentBucketY}`;

    // Track dynamic bucket migrations on the Zone
    const updateBucket = (
      key: string | undefined,
      delta: number,
      add: boolean,
    ) => {
      if (!key) return;
      const bucket = zone.buckets.get(key);
      if (!bucket) return;

      if (add) {
        bucket.entities.add(character.id);
      } else {
        bucket.entities.delete(character.id);
      }
      bucket.userCount += delta;
    };

    if (character.currentBucketKey !== currentBucketKey) {
      updateBucket(character.currentBucketKey, -1, false);
      updateBucket(currentBucketKey, 1, true);
      character.currentBucketKey = currentBucketKey;
    }

    // 3. Decoupled Viewport Tracking
    // Simulates the client's locked camera container so chunk eviction stays stable at map boundaries
    const CLIENT_MAX_WIDTH = character.cameraWidth;
    const CLIENT_MAX_HEIGHT = character.cameraHeight;

    let targetCamX = character.position.x - CLIENT_MAX_WIDTH / 2;
    let targetCamY = character.position.y - CLIENT_MAX_HEIGHT / 2;

    const maxCamX = Math.max(0, zone.map.width - CLIENT_MAX_WIDTH);
    const maxCamY = Math.max(0, zone.map.height - CLIENT_MAX_HEIGHT);
    const finalCamX = Math.max(0, Math.min(targetCamX, maxCamX));
    const finalCamY = Math.max(0, Math.min(targetCamY, maxCamY));

    const serverCameraMinX = finalCamX;
    const serverCameraMaxX = finalCamX + CLIENT_MAX_WIDTH;
    const serverCameraMinY = finalCamY;
    const serverCameraMaxY = finalCamY + CLIENT_MAX_HEIGHT;

    // Calculate intersecting camera buckets using the locked viewport limits
    const startBucketX = Math.max(
      0,
      Math.floor(serverCameraMinX / this.CHUNK_SIZE) - bufferRadius,
    );
    const endBucketX = Math.min(
      Math.ceil(zone.map.width / this.CHUNK_SIZE) - 1,
      Math.ceil(serverCameraMaxX / this.CHUNK_SIZE) + bufferRadius,
    );
    const startBucketY = Math.max(
      0,
      Math.floor(serverCameraMinY / this.CHUNK_SIZE) - bufferRadius,
    );
    const endBucketY = Math.min(
      Math.ceil(zone.map.height / this.CHUNK_SIZE) - 1,
      Math.ceil(serverCameraMaxY / this.CHUNK_SIZE) + bufferRadius,
    );

    // 4. Gather the entire active Area of Interest (AOI) set
    const currentAOI = new Set<string>();
    for (let x = startBucketX; x <= endBucketX; x++) {
      for (let y = startBucketY; y <= endBucketY; y++) {
        currentAOI.add(`${x}_${y}`);
      }
    }

    // 5. Delta Calculations: Only send changes over the websocket
    const unchunks: string[] = [];
    const toLoadKeys: string[] = [];

    // Find buckets the player has walked away from
    for (const key of character.activeAOI) {
      if (!currentAOI.has(key)) unchunks.push(key);
    }

    // Find brand new buckets entering the viewport bounds
    for (const key of currentAOI) {
      if (!character.activeAOI.has(key)) toLoadKeys.push(key);
    }

    // Commit the new AOI state to character memory
    character.activeAOI.clear();
    for (const key of currentAOI) {
      character.activeAOI.add(key);
    }

    // Decrement viewport counters for retired buckets
    for (const bucketKey of unchunks) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) bucket.userCount--;
    }

    // Fetch and prepare WebP texture data for incoming buckets
    const chunks: Chunk[] = [];
    for (const bucketKey of toLoadKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) {
        const chunkData = await this.mapCache.getChunk(zone, bucketKey);
        if (chunkData) {
          chunks.push(chunkData);
        }
      }
    }

    // 6. Return delta state + complete zone bounds to the network handler
    return {
      chunks,
      unchunks,
      zone,
      currentBucketKey,
    };
  }

  add(character: Character): void {
    this.characters.set(character.id, character);
  }

  remove(characterId: number): void {
    this.characters.delete(characterId);
  }
}
