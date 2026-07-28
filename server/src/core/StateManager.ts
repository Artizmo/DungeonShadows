// StateManager.ts

import {
  FLAG_DESPAWN,
  FLAG_DIRTY,
  FLAG_NONE,
  FLAG_POSITION,
  FLAG_SPAWNED,
} from "~/shared/core/constants";
import type World from "./World";
import Character from "./Character";
import Npc from "./Npc";

export default class StateManager {
  private world: World;
  private clientAckedEntities: Map<number, Set<number>> = new Map();

  constructor(world: World) {
    this.world = world;
  }

  public getDirtyState(
    entity: Character | Npc,
    overrideFlags?: number
  ): Record<string, any> | null {
    const flags =
      overrideFlags ?? this.world.entityFlags[entity.id] ?? FLAG_NONE;

    if (flags === FLAG_NONE) return null;

    const isCharacter = entity instanceof Character;
    const isNpc = entity instanceof Npc;
    if (!isCharacter && !isNpc) return null;

    if (flags & FLAG_DESPAWN) {
      return {
        id: entity.id,
        flags: FLAG_DESPAWN,
        type: isCharacter ? "character" : "npc",
      };
    }

    const delta: Record<string, any> = {
      id: entity.id,
      flags: flags,
      type: isCharacter ? "character" : "npc",
    };

    if (flags & FLAG_SPAWNED) {
      delta.name = entity.name;
      delta.level = entity.level;
      delta.width = entity.width;
      delta.height = entity.height;
    }

    if (flags & (FLAG_POSITION | FLAG_SPAWNED)) {
      delta.position = { x: entity.position.x, y: entity.position.y };
    }

    return delta;
  }

  public buildSnapshots(): Map<number, any[]> {
    const recipientSnapshots = new Map<number, any[]>();

    for (const player of this.world.characters.values()) {
      const playerFlags = this.world.entityFlags[player.id] ?? FLAG_NONE;
      if (playerFlags & FLAG_DESPAWN) {
        this.clientAckedEntities.delete(player.id);
        continue;
      }

      let ackedSet = this.clientAckedEntities.get(player.id);
      if (!ackedSet) {
        ackedSet = new Set<number>();
        this.clientAckedEntities.set(player.id, ackedSet);
      }

      const visibleDeltas: any[] = [];

      // 🟢 Read directly from World's spatial map
      const currentVisible =
        this.world.getPlayerVisibleEntities(player.id) ?? new Set<number>();

      // 1. DETECT AOI EXITS -> Send FLAG_DESPAWN
      for (const previousId of ackedSet) {
        if (!currentVisible.has(previousId)) {
          visibleDeltas.push({
            id: previousId,
            flags: FLAG_DESPAWN,
            type: this.world.characters.has(previousId) ? "character" : "npc",
          });
        }
      }

      // 2. DETECT AOI ENTERS & DIRTY UPDATES
      for (const entityId of currentVisible) {
        const isSelf = entityId === player.id;
        const isNewToPlayer = !ackedSet.has(entityId);
        const entityFlags = this.world.entityFlags[entityId] ?? FLAG_NONE;

        if (isNewToPlayer || (entityFlags & FLAG_DIRTY) !== 0) {
          const entity = isSelf
            ? player
            : (this.world.characters.get(entityId) ??
              this.world.entityCompendium.get(entityId));

          if (entity) {
            const effectiveFlags = isNewToPlayer
              ? entityFlags | FLAG_SPAWNED | FLAG_POSITION
              : entityFlags;

            const delta = this.getDirtyState(entity, effectiveFlags);
            if (delta) visibleDeltas.push(delta);
          }
        }
      }

      this.clientAckedEntities.set(player.id, new Set(currentVisible));
      recipientSnapshots.set(player.id, visibleDeltas);
    }

    return recipientSnapshots;
  }
}
