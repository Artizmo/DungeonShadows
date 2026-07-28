import Area from "~/core/Area";
import Character from "~/core/Character";
import MapCache, { type Chunk } from "~/core/MapCache";
import { Log } from "~/shared/core/Logger";
import type Zone from "./Zone";
import {
  FLAG_ACTIVE,
  FLAG_DESPAWN,
  FLAG_DIRTY,
  FLAG_POSITION,
  FLAG_SPAWNED,
  MAX_ENTITIES,
} from "~/shared/core/constants";
import Npc from "./Npc";
import { fetchWorld, type WorldData } from "~/utils/functions/fetchWorld";
import { isEntityInCamera } from "~/utils/functions/CameraFunctions";
import { getCameraBounds } from "~/utils/functions/getCameraBounds";
import {
  calculateAOIBuckets,
  clampPosition,
  getBucketKey,
  getSetDifferences,
} from "~/utils/functions/AOIFunctions";
import { calculateVelocity, type Vector2D } from "~/lib/movement";

export default class World {
  name: string = "";

  // High-level entities & spatial lookups
  areas = new Map<string, Area>();
  zones = new Map<string, Zone>();
  characters = new Map<number, Character>();
  mapCache = new MapCache();
  entityCompendium = new Map<number, Npc>();

  // Reference to network layer for direct packet dispatches
  network: any;

  // Acts and scripts registry for NPCs and global objects
  actsRegistry = new Map<
    string,
    (entity: Npc, world: World, deltaTime: number) => void
  >();

  // --- FAST DATA-ORIENTED LAYERS (Zero GC / High Perf) ---

  // Entity status flags (DIRTY, POSITION, SPAWNED, ACTIVE, etc.)
  entityFlags = new Uint8Array(MAX_ENTITIES);
  // Active status flags (1 active [20Hz]; 0 passive [1.5Hz])
  activeFlags = new Uint8Array(MAX_ENTITIES);

  // Master dense array of ALL global entities (NPCs, items, etc.)
  entityIds = new Int32Array(MAX_ENTITIES);
  entityCount = 0;

  // Active dense array (Only entities inside a player's AOI/Camera)
  activeEntityIds = new Int32Array(MAX_ENTITIES);
  activeEntityCount = 0;

  // 🟢 SPATIAL VISIBILITY LAYER
  // Maps characterId -> Set of entity IDs currently visible inside their camera
  playerVisibilityMap = new Map<number, Set<number>>();

  /**
   * 🟢 Load game world areas, zones, and 100k+ global entities
   */
  async load(worldPath: string): Promise<void> {
    try {
      const worldData: WorldData = await fetchWorld(worldPath);
      this.name = worldData.name;
      this.areas = worldData.areas;
      this.zones = worldData.zones;
      this.entityCompendium = worldData.entities;

      // Register all passive global entities into the master flat array
      for (const entityId of this.entityCompendium.keys()) {
        this.entityIds[this.entityCount++] = entityId;
      }
      this.actsRegistry = worldData.actsRegistry;
    } catch (error) {
      Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    }
  }

  /**
   * 🟢 Sub-millisecond AOI Scan:
   * 1. Evaluates camera bounds for every player
   * 2. Populates playerVisibilityMap (for StateManager to read)
   * 3. Promotes/demotes entities to/from 20Hz Active Processing
   */
  updateCharacterAOI(): void {
    // 1. Snapshot previous active entities to prune demoted entities later
    const prevActiveIds = this.activeEntityIds.slice(0, this.activeEntityCount);

    // 2. Reset active tracking for current tick
    this.activeFlags.fill(0);
    this.activeEntityCount = 0;

    const cameraPadding = 32;

    for (const character of this.characters.values()) {
      const zone = this.getZone(character.zoneId);
      if (!zone) continue;

      // Get or initialize player's visibility set
      let playerVisible = this.playerVisibilityMap.get(character.id);
      if (!playerVisible) {
        playerVisible = new Set<number>();
        this.playerVisibilityMap.set(character.id, playerVisible);
      } else {
        playerVisible.clear();
      }

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

      // Check entities within the player's spatial buckets
      for (const bucketKey of character.AOIBucketKeys) {
        const bucket = zone.getBucket(bucketKey);
        if (!bucket) continue;

        for (const entityId of bucket.entities) {
          // Lookup entity from either connected characters or compendium (NPCs)
          const entity =
            this.characters.get(entityId) ??
            this.entityCompendium.get(entityId);
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
            // 🟢 Add to this player's spatial view
            playerVisible.add(entityId);

            // 🟢 Promote to 20Hz Active Processing List if not already active
            if (this.activeFlags[entityId] !== FLAG_ACTIVE) {
              this.activeFlags[entityId] = FLAG_ACTIVE;
              this.entityFlags[entityId] |= FLAG_ACTIVE;
              this.activeEntityIds[this.activeEntityCount++] = entityId;
            }
          }
        }
      }
    }

    // 3. Strip FLAG_ACTIVE from entities no longer visible to ANY connected player
    for (let i = 0; i < prevActiveIds.length; i++) {
      const id = prevActiveIds[i];
      if (this.activeFlags[id] !== FLAG_ACTIVE) {
        this.entityFlags[id] &= ~FLAG_ACTIVE;
      }
    }
  }

  /**
   * Helper for StateManager to read player visibility without doing spatial checks
   */
  public getPlayerVisibleEntities(
    characterId: number
  ): Set<number> | undefined {
    return this.playerVisibilityMap.get(characterId);
  }

  /**
   * 🟢 Update Character Spatial Zone and Stream Chunks Synchronously
   */
  updateCharacterSpatialZone(
    character: Character,
    bufferRadius: number = 1
  ): {
    zone: Zone;
    chunks: Chunk[];
    unchunks: string[];
    currentBucketId: string;
  } {
    const zone = this.getZone(character.zoneId);
    if (!zone) throw new Error("Zone not found");

    clampPosition(character.position, zone.map.width, zone.map.height, 0);

    const currentBucketId = getBucketKey(
      character.position.x,
      character.position.y
    );

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

    if (character.currentBucketId !== currentBucketId) {
      updateBucket(character.currentBucketId, -1, false);
      updateBucket(currentBucketId, 1, true);
      character.currentBucketId = currentBucketId;
    }

    const currentAOI = calculateAOIBuckets(
      character.position.x,
      character.position.y,
      character.cameraWidth,
      character.cameraHeight,
      zone.map.width,
      zone.map.height,
      bufferRadius
    );

    const { removed: unchunks } = getSetDifferences(
      character.AOIBucketKeys,
      currentAOI
    );

    character.AOIBucketKeys.clear();
    for (const key of currentAOI) {
      character.AOIBucketKeys.add(key);
    }

    for (const bucketKey of unchunks) {
      const bucket = zone.buckets.get(bucketKey);
      if (bucket) bucket.userCount--;
    }

    const chunks: Chunk[] = [];

    // 🟢 Iterate through ALL buckets in current AOI range
    for (const bucketKey of character.AOIBucketKeys) {
      // 1. Try Instant Sync Read from RAM Cache
      const chunkData = this.mapCache.getChunkSync(zone, bucketKey);

      if (chunkData) {
        chunks.push(chunkData);
      } else {
        // 2. Cache Miss! Fire non-blocking disk fetch to warm cache & stream when ready
        this.mapCache
          .fetchAndCacheChunk(zone, bucketKey)
          .then((loadedChunk) => {
            if (
              loadedChunk &&
              character.AOIBucketKeys.has(bucketKey) &&
              this.network
            ) {
              this.network.sendChunkToPlayer(character.id, loadedChunk);
            }
          });
      }
    }

    return { chunks, unchunks, zone, currentBucketId };
  }

  /**
   * 🟢 Spawn any entity (Character, NPC, Item) into a zone bucket
   */
  public spawn(
    entity: any,
    zoneId: string | null = null,
    x: number | null = null,
    y: number | null = null
  ): void {
    if (x !== null && y !== null) {
      entity.position.x = x;
      entity.position.y = y;
    }
    if (zoneId) {
      entity.zoneId = zoneId;
    }

    const zone = this.getZone(entity.zoneId);
    if (!zone) return;

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

    let exists = false;
    for (let i = 0; i < this.entityCount; i++) {
      if (this.entityIds[i] === entity.id) {
        exists = true;
        break;
      }
    }
    if (!exists && this.entityCount < MAX_ENTITIES) {
      this.entityIds[this.entityCount++] = entity.id;
    }

    this.entityFlags[entity.id] |= FLAG_SPAWNED | FLAG_DIRTY;
  }

  postTickCleanup(): void {
    // 1. Clear Characters
    for (const character of this.characters.values()) {
      this.entityFlags[character.id] &= ~(FLAG_DIRTY | FLAG_POSITION);
    }

    // 2. Clear Active NPCs / Compendium Entities
    for (let i = 0; i < this.activeEntityCount; i++) {
      const id = this.activeEntityIds[i];
      this.entityFlags[id] &= ~(FLAG_DIRTY | FLAG_POSITION);
    }

    // 3. Cleanup Despawns
    for (const character of Array.from(this.characters.values())) {
      if ((this.entityFlags[character.id] & FLAG_DESPAWN) !== 0) {
        this.removeCharacter(character.id);
      }
    }
  }

  getCharactersInAOI(character: Character): number[] {
    const zone = this.getZone(character.zoneId);
    if (!zone) return [];

    const neighbors = new Set<number>();

    for (const bucketKey of character.AOIBucketKeys) {
      const bucket = zone.buckets.get(bucketKey);
      if (!bucket) continue;

      for (const entityId of bucket.entities) {
        if (entityId !== character.id && this.characters.has(entityId)) {
          neighbors.add(entityId);
        }
      }
    }

    return Array.from(neighbors);
  }

  despawn(characterId: number): void {
    if (!characterId || this.entityFlags[characterId] === 0) return;
    this.entityFlags[characterId] |= FLAG_DESPAWN | FLAG_DIRTY;
  }

  connect(character: Character): Promise<void> {
    if (this.characters.has(character.id)) return;

    this.addCharacter(character);
    this.spawn(character);
    Log.NETWORK.INFO(`${character.player.fullName} has connected!`);
  }

  disconnect(characterId: number): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    this.despawn(characterId);
    Log.NETWORK.INFO(`${character.player.fullName} has disconnected!`);
  }

  moveCharacter(
    characterId: number,
    directionVector: Vector2D,
    deltaTime: number
  ): void {
    const character = this.characters.get(characterId);
    if (!character) return;

    const velocity = calculateVelocity(
      directionVector,
      character.speed,
      deltaTime
    );
    if (velocity.x === 0 && velocity.y === 0) return;

    this.entityFlags[characterId] |= FLAG_DIRTY | FLAG_POSITION;
    character.move(velocity);

    this.updateCharacterSpatialZone(character);
  }

  addCharacter(character: Character): void {
    this.characters.set(character.id, character);
  }

  removeCharacter(characterId: number): void {
    const character = this.characters.get(characterId);

    if (character) {
      const zone = this.getZone(character.zoneId);
      if (zone && character.currentBucketId) {
        const bucket = zone.buckets.get(character.currentBucketId);
        if (bucket) {
          bucket.entities.delete(characterId);
          bucket.userCount = Math.max(0, bucket.userCount - 1);
        }
      }
      this.characters.delete(characterId);
    }

    // Clean up spatial tracking & flags
    this.playerVisibilityMap.delete(characterId);
    this.entityFlags[characterId] = 0;
    this.activeFlags[characterId] = 0;

    for (let i = 0; i < this.entityCount; i++) {
      if (this.entityIds[i] === characterId) {
        this.entityIds[i] = this.entityIds[--this.entityCount];
        break;
      }
    }
  }

  getZone(zoneId: string): Zone | undefined {
    if (!zoneId) return undefined;
    return this.zones.get(zoneId);
  }
}
