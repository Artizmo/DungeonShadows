import { FLAG_SPAWNED } from "~/shared/core/constants.js";

export type ActFunction = (entity: any, world: any, deltaTime: number) => void;

export const acts: Record<string, ActFunction> = {
  spawn: (entity, world, deltaTime) => {
    if ((world.entityFlags[entity.id] & FLAG_SPAWNED) !== 0) return;

    world.spawn(
      entity,
      entity.zone.areaId,
      entity.zone.id,
      entity.position.x,
      entity.position.y
    );
  },
};
