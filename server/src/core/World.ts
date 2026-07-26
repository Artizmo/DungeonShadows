import Area from "~/core/Area";
import Character from "~/core/Character";
import MapCache, { type Chunk } from "~/core/MapCache";
import { Log } from "~/shared/core/Logger";
import type Zone from "./Zone";
import type { ICoords } from "~/shared/core/types";
import {
  CHUNK_SIZE,
  FLAG_ACTIVE,
  FLAG_DIRTY,
  FLAG_SPAWNED,
  MAX_ENTITIES,
} from "~/shared/core/constants";
import Npc from "./Npc";
import { fetchWorld, type WorldData } from "~/_utils/functions/fetchWorld";
import { isEntityInCamera } from "~/_utils/functions/CameraFunctions";
import { getCameraBounds } from "~/_utils/functions/getCameraBounds";
import {
  calculateAOIBuckets,
  clampPosition,
  getBucketKey,
  getSetDifferences,
} from "~/_utils/functions/AOIFunctions";

export default class World {
  name: string = "";

  // High-level entities & spatial lookups
  areas = new Map<string, Area>();
  zones = new Map<string, Zone>();
  characters = new Map<number, Character>();
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
      this.zones = worldData.zones;
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
   * 🟢 Update Character AOI.
   * Runs in sub-millisecond execution time.
   */
  updateCharacterAOI(): void {
    // Reset active flags and refresh with new flags
    this.activeFlags.fill(0);
    this.activeEntityCount = 0;

    const cameraPadding = 32;
    for (const character of this.characters.values()) {
      const zone = this.getZone(character.zoneId);

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
      for (const bucketKey of character.AOIBucketKeys) {
        const bucket = zone.getBucket(bucketKey);
        if (!bucket) continue;

        for (const entityId of bucket.entities) {
          if (this.activeFlags[entityId] === FLAG_ACTIVE) continue;

          const entity = this.entityCompendium.get(entityId);
          if (!entity) continue;

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
            this.activeFlags[entityId] = FLAG_ACTIVE;
            this.activeEntityIds[this.activeEntityCount++] = entityId;
          }
        }
      }
    }
  }

  /**
   * 🟢 Update Character AOI.
   */
  async updateCharacterSpatialZone(
    character: Character,
    bufferRadius: number = 1
  ): Promise<{
    zone: Zone;
    chunks: Chunk[];
    unchunks: string[];
    currentBucketId: string;
  }> {
    const zone = this.areas.get(character.areaId).getZone(character.zoneId);
    if (!zone) throw new Error("Zone not found");

    // Clamp character to map borders
    clampPosition(character.position, zone.map.width, zone.map.height, 0);

    // Identify which bucket the character is in
    const currentBucketId = getBucketKey(
      character.position.x,
      character.position.y
    );

    // Update world bucket state
    const updateBucket = (
      key: string | undefined,
      deltaCount: number,
      addEntity: boolean
    ) => {
      if (!key) return;
      const bucket = zone.buckets.get(key);
      if (!bucket) return;

      if (addEntity) bucket.entities.add(character.id);
      else bucket.entities.delete(character.id);

      bucket.userCount += deltaCount;
    };

    // Move character between physical buckets if they crossed a line
    if (character.currentBucketId !== currentBucketId) {
      updateBucket(character.currentBucketId, -1, false);
      updateBucket(currentBucketId, 1, true);
      character.currentBucketId = currentBucketId;
    }

    // Calculate the new AOI
    const currentAOI = calculateAOIBuckets(
      character.position.x,
      character.position.y,
      character.cameraWidth,
      character.cameraHeight,
      zone.map.width,
      zone.map.height,
      bufferRadius
    );

    // Find which chunks fell out of view, and which are newly visible
    const { removed: unchunks, added: toLoadKeys } = getSetDifferences(
      character.AOIBucketKeys,
      currentAOI
    );

    // Apply the new AOI state to the character
    character.AOIBucketKeys.clear();
    for (const key of currentAOI) {
      character.AOIBucketKeys.add(key);
    }

    // Decrement users in old chunks
    for (const bucketKey of unchunks) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) bucket.userCount--;
    }

    // Cache and load new chunks
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

    return { chunks, unchunks, zone, currentBucketId };
  }

  /**
   * 🟢 Spawn entity using current entity position or new position.
   */
  public spawn(
    entity: any,
    zoneId: string = null,
    x: number = null,
    y: number = null
  ): void {
    if (x && y) {
      entity.position.x = x;
      entity.position.y = y;
    }
    if (zoneId) {
      entity.zoneId = zoneId;
    }

    const zone = this.getZone(entity.zoneId);
    const bucketId = zone.getBucketIdByCoords(
      entity.position.x,
      entity.position.y
    );
    let bucket = zone.getBucket(bucketId);

    if (!bucket) {
      bucket = {
        id: bucketId,
        entities: new Set<number>(),
        staticObjects: [],
        userCount: 0,
      };
      zone.buckets.set(bucket.id, bucket);
    }

    bucket.entities.add(entity.id);
    entity.currentBucketId = bucketId;
    this.entityIds[this.entityCount++] = entity.id;
    this.entityFlags[entity.id] |= FLAG_SPAWNED | FLAG_DIRTY;
  }

  /**
   * 🟢 Get the current state for a character's AOI
   */
  public getAOIState(character: Character): any[] {
    const zone = this.getZone(character.zoneId);
    if (!zone) return [];

    const visibleEntities: any[] = [];
    for (const bucketKey of character.AOIBucketKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (!bucket) continue;

      for (const entityId of bucket.entities) {
        if (entityId === character.id) continue;

        const entity =
          this.entityCompendium.get(entityId) || this.characters.get(entityId);
        if (!entity) continue;

        visibleEntities.push({
          id: entity.id,
          name: entity.name,
          level: entity.level,
          type: entity instanceof Character ? "character" : "npc",
          position: { x: entity.position.x, y: entity.position.y },
        });
      }
    }
    return visibleEntities;
  }

  addCharacter(character: Character): void {
    this.characters.set(character.id, character);
  }

  removeCharacter(characterId: number): void {
    this.characters.delete(characterId);
  }

  getZone(zoneId: string): Zone {
    if (!zoneId) return;

    return this.zones.get(zoneId);
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
