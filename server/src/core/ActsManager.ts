import type World from "~/core/World";

const TICK_RATE_HZ = 20;
const COLD_RATE_HZ = 1.5;

// 13 ticks = ~650ms between passive updates for any given entity
const COLD_SLICE_COUNT = Math.round(TICK_RATE_HZ / COLD_RATE_HZ);

export type Act = (entity: any, world: World, deltaTime: number) => void;

export default class ActsManager {
  private world: World;

  constructor(world: World) {
    this.world = world;
  }

  tick(tick: number, deltaTime: number): void {
    // 1. Populate world.activeEntityIds with entities near players
    this.world.updateCharacterAOI();

    // 2. HOT PATH (Entities on screen) - Executes EVERY tick
    const totalActive = this.world.activeEntityCount;
    if (totalActive > 0) {
      // FIX: Use traditional for-loop to avoid iterating the entire 100k array
      for (let i = 0; i < totalActive; i++) {
        const entityId = this.world.activeEntityIds[i];
        const entity = this.world.entityCompendium.get(entityId);

        if (!entity || !entity.acts) continue;

        for (const actKey of entity.acts) {
          const actFn = this.world.actsRegistry.get(actKey);
          if (actFn) {
            actFn(entity, this.world, deltaTime);
          }
        }
      }
    }

    // 3. COLD PATH (Distant entities) - Executes in slices
    const totalCold = this.world.entityCount;
    if (totalCold > 0) {
      const currentSlice = tick % COLD_SLICE_COUNT;

      for (let i = currentSlice; i < totalCold; i += COLD_SLICE_COUNT) {
        const entityId = this.world.entityIds[i];

        // FIX: Skip this entity if it was just processed in the HOT PATH!
        if (this.world.activeFlags[entityId] === 1) continue;

        const entity = this.world.entityCompendium.get(entityId);

        if (!entity || !entity.acts) continue;

        for (const actKey of entity.acts) {
          const actFn = this.world.actsRegistry.get(actKey);
          if (actFn) {
            actFn(entity, this.world, deltaTime);
          }
        }
      }
    }
  }
}
