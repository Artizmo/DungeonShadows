import {
  MAX_ENTITIES,
  MAX_ITEMS,
  MAX_STRUCTURES,
} from "~/shared/core/constants";

import {
  EntityFlags,
  ItemFlags,
  StructureFlags,
  ZoneFlags,
  PacketCategory,
  type CharacterRecord,
} from "~/shared/core/types";

import type World from "~/core/World";
import type Character from "./Character";

export class DeltaRecord implements Partial<CharacterRecord> {
  public id: number = -1;
  public name?: string;
  public playerId?: number;
  public level?: number;
  public speed?: number;
  public zoneId?: string;
  public areaId?: string;
  public x?: number;
  public y?: number;
  public cameraWidth?: number;
  public cameraHeight?: number;

  public reset(id: number = -1): void {
    this.id = id;
    this.name = undefined;
    this.playerId = undefined;
    this.level = undefined;
    this.speed = undefined;
    this.zoneId = undefined;
    this.areaId = undefined;
    this.x = undefined;
    this.y = undefined;
    this.cameraWidth = undefined;
    this.cameraHeight = undefined;
  }
}

export class BitmaskTracker<T extends number = number> {
  public readonly flags: Int32Array;
  public readonly dirtyList: Int32Array;
  public count = 0;

  constructor(capacity: number) {
    this.flags = new Int32Array(capacity);
    this.dirtyList = new Int32Array(capacity);
  }

  public mark(id: number, flag: T): void {
    if (flag === 0) return;

    if (this.flags[id] === 0) {
      this.dirtyList[this.count++] = id;
    }
    this.flags[id] |= flag;
  }

  public isDirty(): boolean {
    return this.count > 0;
  }

  public clear(): void {
    for (let i = 0; i < this.count; i++) {
      this.flags[this.dirtyList[i]] = 0;
    }
    this.count = 0;
  }
}

export class CharacterTargetState {
  public readonly character = new BitmaskTracker<EntityFlags>(1);
  public readonly zone = new BitmaskTracker<ZoneFlags>(1);
  public readonly entities = new BitmaskTracker<EntityFlags>(MAX_ENTITIES);
  public readonly items = new BitmaskTracker<ItemFlags>(MAX_ITEMS);
  public readonly structures = new BitmaskTracker<StructureFlags>(
    MAX_STRUCTURES
  );

  public isDirty(): boolean {
    return (
      this.character.isDirty() ||
      this.zone.isDirty() ||
      this.entities.isDirty() ||
      this.items.isDirty() ||
      this.structures.isDirty()
    );
  }

  public clear(): void {
    this.character.clear();
    this.zone.clear();
    this.entities.clear();
    this.items.clear();
    this.structures.clear();
  }
}

export default class StateManager {
  private readonly world: World;
  private readonly targetStates: (CharacterTargetState | undefined)[] =
    new Array(MAX_ENTITIES);

  // --- REUSABLE PRE-ALLOCATED BUFFERS (0 GC) ---
  private readonly snapshotPayload: Record<string, any> = {
    category: PacketCategory.SNAPSHOT,
    tick: 0,
    sequenceId: 0,
    zone: undefined,
    entities: undefined,
    character: undefined,
  };

  private readonly zonePayload = {
    id: "",
    name: "",
    map: null as any,
  };

  private readonly characterDelta = new DeltaRecord();

  // Fixed capacity buffer - NEVER mutate .length
  private readonly entityDeltaBuffer: DeltaRecord[] = Array.from(
    { length: MAX_ENTITIES },
    () => new DeltaRecord()
  );

  // Reusable export slice array to avoid reallocations
  private readonly activeEntityExport: DeltaRecord[] = [];

  public activeEntityCount = 0;

  constructor(world: World) {
    this.world = world;
  }

  public getTargetState(characterId: number): CharacterTargetState {
    return (this.targetStates[characterId] ??= new CharacterTargetState());
  }

  public snapshot(
    characterId: number,
    tick: number
  ): Record<string, any> | null {
    const character = this.world.characters[characterId];
    if (!character) return null;

    // Reset baseline metadata on every snapshot
    this.snapshotPayload.tick = tick;
    this.snapshotPayload.sequenceId = character.sequenceId;
    this.snapshotPayload.zone = undefined;
    this.snapshotPayload.entities = undefined;
    this.snapshotPayload.character = undefined;

    const targetState = this.targetStates[characterId];
    if (!targetState || !targetState.isDirty()) return this.snapshotPayload;

    // 1. LOCAL CHARACTER
    if (targetState.character.isDirty()) {
      this.serializeCharacterDelta(targetState.character, character);
      this.snapshotPayload.character = this.characterDelta;
    }

    // 2. ZONE METADATA STREAMING
    if (targetState.zone.isDirty()) {
      this.serializeZoneDeltas(targetState.zone, character.zoneId);
    }

    // 3. OTHER ENTITIES
    if (targetState.entities.isDirty()) {
      this.serializeEntityDeltas(targetState.entities);

      if (this.activeEntityCount > 0) {
        // Zero-allocation export slicing
        this.activeEntityExport.length = this.activeEntityCount;
        for (let i = 0; i < this.activeEntityCount; i++) {
          this.activeEntityExport[i] = this.entityDeltaBuffer[i];
        }
        this.snapshotPayload.entities = this.activeEntityExport;
      }
    }

    return this.snapshotPayload;
  }

  private serializeCharacterDelta(
    tracker: BitmaskTracker<EntityFlags>,
    character: Character
  ): void {
    const flagMask = tracker.flags[0];
    if (flagMask === 0) return;

    const delta = this.characterDelta;
    delta.reset(character.id);

    if (flagMask & EntityFlags.SPAWNED) {
      delta.name = character.name;
      delta.playerId = character.player.id;
      delta.level = character.level;
      delta.speed = character.speed;
      delta.zoneId = character.zoneId;
      delta.areaId = character.areaId;
      delta.cameraWidth = character.camera.width;
      delta.cameraHeight = character.camera.height;
    }

    if (flagMask & (EntityFlags.SPAWNED | EntityFlags.POSITION)) {
      delta.x = character.transform.position.x;
      delta.y = character.transform.position.y;
    }
  }

  private serializeZoneDeltas(
    tracker: BitmaskTracker<ZoneFlags>,
    zoneId: string
  ): void {
    const flagMask = tracker.flags[0];
    if (flagMask === 0) return;

    const zone = this.world.zoneManager.zones.get(zoneId);
    if (zone) {
      this.zonePayload.id = zone.id;
      this.zonePayload.name = zone.name;
      this.zonePayload.map = zone.map;
      this.snapshotPayload.zone = this.zonePayload;
    }
  }

  private serializeEntityDeltas(tracker: BitmaskTracker<EntityFlags>): void {
    const { count, dirtyList, flags } = tracker;
    this.activeEntityCount = 0;

    for (let i = 0; i < count; i++) {
      const entityId = dirtyList[i];
      const flagMask = flags[entityId];
      if (flagMask === 0) continue;

      const entity =
        this.world.compendium[entityId] ?? this.world.characters[entityId];
      if (!entity) continue;

      if (this.activeEntityCount >= MAX_ENTITIES) break;

      const delta = this.entityDeltaBuffer[this.activeEntityCount];
      delta.reset(entityId);

      if (flagMask & EntityFlags.SPAWNED) {
        delta.name = entity.name;
        delta.zoneId = entity.zoneId;
      }

      if (flagMask & (EntityFlags.SPAWNED | EntityFlags.POSITION)) {
        delta.x = entity.transform.position.x;
        delta.y = entity.transform.position.y;
      }

      this.activeEntityCount++;
    }
  }

  public clearTarget(characterId: number): void {
    this.targetStates[characterId]?.clear();
  }

  public removeTarget(characterId: number): void {
    this.targetStates[characterId] = undefined;
  }
}
