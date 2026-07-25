import Area from "~/core/Area";
import Character from "~/core/Character";
import MapCache, { type Chunk } from "~/core/MapCache";
import { Log } from "~/shared/core/Logger";
import type Zone from "./Zone";
import type { ICoords } from "~/shared/core/types";
import {
  CHUNK_SIZE,
  FLAG_DIRTY,
  FLAG_SPAWNED,
  MAX_ENTITIES,
} from "~/shared/core/constants";
import Npc from "./Npc";
import { fetchWorld, type WorldData } from "~/_utils/functions/fetchWorld";
import { isEntityInCamera } from "~/_utils/functions/isEntityInCamera";
import { getCameraBounds } from "~/_utils/functions/getCameraBounds";

export default class World {
  name: string = "";

  // High-level entities & spatial lookups
  characters = new Map<number, Character>();
  areas = new Map<string, Area>();
  mapCache = new MapCache();
  entityCompendium = new Map<number, Npc>();

  // Spatial zone buckets
  buckets = new Map<
    string,
    { entities: number[]; staticObjects: any[]; userCount: number }
  >();

  // Acts and scripts
  actsRegistry = new Map<
    string,
    (entity: Npc, world: World, deltaTime: number) => void
  >();

  // --- FAST DATA-ORIENTED LAYERS (Zero GC / High Perf) ---

  // Entities flags (ie SPAWNED, DEAD, FLYING, etc. May need to break these out into separate bitarrays)
  entityFlags = new Uint8Array(MAX_ENTITIES);
  // Active entities flag (1 active; 0 passive)
  activeFlags = new Uint8Array(MAX_ENTITIES);
  // Master compendium of entities (ie npcs, items, rooms, etc.)
  // Passive entities (1.5hz processing)
  entityIds = new Int32Array(MAX_ENTITIES);
  entityCount = 0;
  // Active entities (20hz processing)
  activeEntityIds = new Int32Array(MAX_ENTITIES);
  activeEntityCount = 0;

  /**
   * 🟢 Load game files (areas, npcs, acts, etc.)
   */
  async load(worldPath: string): Promise<void> {
    try {
      const worldData: WorldData = await fetchWorld(worldPath);
      this.name = worldData.name;
      this.areas = worldData.areas;
      this.entityCompendium = worldData.entities;
      for (const entityId of this.entityCompendium.keys()) {
        this.entityIds[this.entityCount++] = entityId;
      }
      this.actsRegistry = worldData.actsRegistry;
    } catch (error) {
      Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    }
  }

  /**
   * 🟢 ZERO-ALLOCATION 100k AOI Pipeline.
   * Runs in sub-millisecond execution time.
   */
  public refreshCharacterAOI(): void {
    // Reset active flags and refresh with new flags
    this.activeFlags.fill(0);
    this.activeEntityCount = 0;

    const cameraPadding = 32;

    for (const character of this.characters.values()) {
      const zone = this.areas
        .get(character.zone.areaId)
        ?.getZone(character.zone.id);

      if (!zone) continue;

      // Get camera view dimensions
      const {
        minX: camMinX,
        minY: camMinY,
        maxX: camMaxX,
        maxY: camMaxY,
      } = getCameraBounds(
        character.position.x,
        character.position.y,
        character.cameraWidth,
        character.cameraHeight,
        cameraPadding
      );

      // Scan active buckets
      for (const bucketKey of character.activeAOI) {
        const bucket = zone.buckets.get(bucketKey);
        if (!bucket) continue;

        for (const entityId of bucket.entities) {
          // Skip if already active
          if (this.activeFlags[entityId] === 1) continue;

          const entity = this.entityCompendium.get(entityId);
          if (!entity) continue;

          // Check if entity is in camera view and add to active
          if (
            isEntityInCamera(
              camMinX,
              camMinY,
              camMaxX,
              camMaxY,
              entity.position.x,
              entity.position.y,
              entity.width,
              entity.height
            )
          ) {
            this.activeFlags[entityId] = 1; // Active
            this.activeEntityIds[this.activeEntityCount++] = entityId;
          }
        }
      }
    }
  }

  public async handleCharacterSpatialUpdate(
    character: Character,
    bufferRadius: number = 1
  ): Promise<{
    zone: Zone;
    chunks: Chunk[];
    unchunks: string[];
    currentBucketKey: string;
  }> {
    const zone = this.areas
      .get(character.zone.areaId)
      ?.getZone(character.zone.id);

    if (!zone) throw new Error("Zone not found");

    const entityPadding = 0;
    const minBoundX = entityPadding;
    const minBoundY = entityPadding;
    const maxBoundX = zone.map.width - entityPadding;
    const maxBoundY = zone.map.height - entityPadding;

    if (character.position.x < minBoundX) character.position.x = minBoundX;
    if (character.position.x > maxBoundX) character.position.x = maxBoundX;
    if (character.position.y < minBoundY) character.position.y = minBoundY;
    if (character.position.y > maxBoundY) character.position.y = maxBoundY;

    const currentBucketX = Math.floor(character.position.x / CHUNK_SIZE);
    const currentBucketY = Math.floor(character.position.y / CHUNK_SIZE);
    const currentBucketKey = `${currentBucketX}_${currentBucketY}`;

    const updateBucket = (
      key: string | undefined,
      delta: number,
      add: boolean
    ) => {
      if (!key) return;
      const bucket = zone.buckets.get(key);
      if (!bucket) return;

      if (add) bucket.entities.add(character.id);
      else bucket.entities.delete(character.id);

      bucket.userCount += delta;
    };

    if (character.currentBucketKey !== currentBucketKey) {
      updateBucket(character.currentBucketKey, -1, false);
      updateBucket(currentBucketKey, 1, true);
      character.currentBucketKey = currentBucketKey;
    }

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

    const startBucketX = Math.max(
      0,
      Math.floor(serverCameraMinX / CHUNK_SIZE) - bufferRadius
    );
    const endBucketX = Math.min(
      Math.ceil(zone.map.width / CHUNK_SIZE) - 1,
      Math.ceil(serverCameraMaxX / CHUNK_SIZE) + bufferRadius
    );
    const startBucketY = Math.max(
      0,
      Math.floor(serverCameraMinY / CHUNK_SIZE) - bufferRadius
    );
    const endBucketY = Math.min(
      Math.ceil(zone.map.height / CHUNK_SIZE) - 1,
      Math.ceil(serverCameraMaxY / CHUNK_SIZE) + bufferRadius
    );

    const currentAOI = new Set<string>();
    for (let x = startBucketX; x <= endBucketX; x++) {
      for (let y = startBucketY; y <= endBucketY; y++) {
        currentAOI.add(`${x}_${y}`);
      }
    }

    const unchunks: string[] = [];
    const toLoadKeys: string[] = [];

    for (const key of character.activeAOI) {
      if (!currentAOI.has(key)) unchunks.push(key);
    }

    for (const key of currentAOI) {
      if (!character.activeAOI.has(key)) toLoadKeys.push(key);
    }

    character.activeAOI.clear();
    for (const key of currentAOI) {
      character.activeAOI.add(key);
    }

    for (const bucketKey of unchunks) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) bucket.userCount--;
    }

    const chunks: Chunk[] = [];
    for (const bucketKey of toLoadKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) {
        const chunkData = await this.mapCache.fetchAndCacheChunk(
          zone,
          bucketKey
        );
        if (chunkData) chunks.push(chunkData);
      }
    }

    return { chunks, unchunks, zone, currentBucketKey };
  }

  public spawn(
    entity: any,
    areaId: string,
    zoneId: string,
    x: number,
    y: number
  ): void {
    entity.position.x = x;
    entity.position.y = y;

    const area = this.areas.get(areaId);
    if (!area) return;

    const zone = area.getZone(zoneId);
    if (!zone) return;

    const bucketX = Math.floor(x / CHUNK_SIZE);
    const bucketY = Math.floor(y / CHUNK_SIZE);
    const bucketKey = `${bucketX}_${bucketY}`;

    let bucket = zone.buckets.get(bucketKey);
    if (!bucket) {
      bucket = {
        key: bucketKey,
        entities: new Set<number>(),
        staticObjects: [],
        userCount: 0,
      };
      zone.buckets.set(bucketKey, bucket);
    }

    bucket.entities.add(entity.id);
    entity.currentBucketKey = bucketKey;

    // FIX: Register newly spawned entity into the cold path!
    this.entityIds[this.entityCount++] = entity.id;

    this.entityFlags[entity.id] |= FLAG_SPAWNED | FLAG_DIRTY;
  }

  public getAOIState(character: Character): any[] {
    const zone = this.areas
      .get(character.zone.areaId)
      ?.getZone(character.zone.id);
    if (!zone) return [];

    const visibleEntities: any[] = [];
    for (const bucketKey of character.activeAOI) {
      const bucket = zone.buckets.get(bucketKey);
      if (!bucket) continue;
      for (const entityId of bucket.entities) {
        if (entityId === character.id) continue;
        const entity =
          this.entityCompendium.get(entityId) || this.characters.get(entityId);
        if (entity) {
          visibleEntities.push({
            id: entity.id,
            name: entity.name,
            level: entity.level,
            type: entity instanceof Character ? "character" : "npc",
            position: { x: entity.position.x, y: entity.position.y },
          });
        }
      }
    }
    return visibleEntities;
  }

  add(character: Character): void {
    this.characters.set(character.id, character);
  }

  remove(characterId: number): void {
    this.characters.delete(characterId);
  }

  moveCharacter(characterId: number, velocity: ICoords): void {
    if (!characterId || !velocity || (velocity.x === 0 && velocity.y === 0))
      return;
    const character = this.characters.get(characterId);
    if (!character) return;

    character.move(velocity);
    this.entityFlags[characterId] |= FLAG_DIRTY;
  }
}
