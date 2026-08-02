import StateManager from "~/core/StateManager";
import { MAX_ENTITIES } from "~/shared/core/constants";

import type World from "~/core/World";
import { type Entity } from "~/shared/core/types";

export default class EntityManager {
  // Passive entities (runs at 1.5hz)
  entityIds = new Int32Array(MAX_ENTITIES);
  entityCount = 0;
  entityIndex = new Int32Array(MAX_ENTITIES).fill(-1);

  // Active entities (runs at 20Hz)
  activeEntityIds = new Int32Array(MAX_ENTITIES);
  activeEntityCount = 0;
  activeEntityIndex = new Int32Array(MAX_ENTITIES).fill(-1);

  private state = new StateManager();
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  load(entities: Map<number, Entity>): void {
    if (!entities.size) return;

    for (const [id, entity] of entities.entries()) {
      this.add(id, entity);
      this.world.compendium[id] = entity;
    }
  }

  add(entityId: number, entity: Entity): void {
    if (this.entityIndex[entityId] !== -1) return;
    if (this.has(entityId)) return;

    this.entityIndex[entityId] = this.entityCount;
    this.entityIds[this.entityCount++] = entityId;
  }

  remove(id: number): void {
    if (!this.has(id)) return;

    this.deactivate(id);
    const lastEntityId = this.entityIds[--this.entityCount];
    const index = this.entityIndex[id];
    this.entityIds[index] = lastEntityId;
    this.entityIndex[lastEntityId] = index;
    this.entityIndex[id] = -1;
  }

  activate(id: number): void {
    if (this.isActive(id)) return;

    this.activeEntityIndex[id] = this.activeEntityCount;
    this.activeEntityIds[this.activeEntityCount++] = id;
  }

  deactivate(id: number): void {
    if (!this.isActive(id)) return;

    const lastEntityId = this.activeEntityIds[--this.activeEntityCount];
    const index = this.activeEntityIndex[id];
    this.activeEntityIds[index] = lastEntityId;
    this.activeEntityIndex[lastEntityId] = index;
    this.activeEntityIndex[id] = -1;
  }

  // Helper functions
  has(id: number): boolean {
    return this.entityIndex[id] !== -1;
  }

  isActive(id: number): boolean {
    return this.activeEntityIndex[id] !== -1;
  }
}
