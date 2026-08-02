import {
  MAX_ENTITIES,
  MAX_ITEMS,
  MAX_STRUCTURES,
  MAX_CHUNKS,
} from "~/shared/core/constants";

import {
  ChunkFlags,
  EntityFlags,
  ItemFlags,
  StructureFlags,
} from "~/shared/core/types";

export class CharacterTargetState {
  public readonly entities = new BitmaskTracker<EntityFlags>(MAX_ENTITIES);
  public readonly items = new BitmaskTracker<ItemFlags>(MAX_ITEMS);
  public readonly structures = new BitmaskTracker<StructureFlags>(
    MAX_STRUCTURES
  );
  public readonly chunks = new BitmaskTracker<ChunkFlags>(MAX_CHUNKS);

  /**
   * Fast O(1) check to see if this character has any pending state to serialize.
   */
  public isDirty(): boolean {
    return (
      this.entities.count > 0 ||
      this.items.count > 0 ||
      this.structures.count > 0 ||
      this.chunks.count > 0
    );
  }

  public clear(): void {
    this.entities.clear();
    this.items.clear();
    this.structures.clear();
    this.chunks.clear();
  }
}

export default class StateManager {
  private readonly targetStates: CharacterTargetState[] = [];

  constructor() {
    // Pre-allocate target states up to MAX_ENTITIES for flat memory & zero GC
    for (let i = 0; i < MAX_ENTITIES; i++) {
      this.targetStates[i] = new CharacterTargetState();
    }
  }

  /**
   * Get character private target state tracker
   */
  public getTargetState(characterId: number): CharacterTargetState {
    return this.targetStates[characterId];
  }

  /**
   * Clear all target dirty flags for a given character ID
   */
  public clearTarget(characterId: number): void {
    this.targetStates[characterId].clear();
  }
}

/**
 * Helper class to track dirty bitmask flags for flat typed arrays.
 */
export class BitmaskTracker<T extends number = number> {
  public readonly flags: Int32Array;
  public readonly dirtyList: Int32Array;
  public count: number = 0;

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

  public clear(): void {
    for (let i = 0; i < this.count; i++) {
      this.flags[this.dirtyList[i]] = 0;
    }
    this.count = 0;
  }
}
