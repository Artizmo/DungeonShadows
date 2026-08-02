import { Log } from "~/shared/core/Logger";
import { type Act } from "~/shared/core/types";
import Character from "~/core/Character";
import EntityManager from "~/core/EntityManager";
import ZoneManager from "~/core/ZoneManager";
import { fetchWorld, type WorldData } from "~/utils/fetchWorld";
import { MAX_ENTITIES } from "~/shared/core/constants";

import {
  EntityFlags,
  type Entity,
  type IWorld,
  type Transform2D,
} from "~/shared/core/types";
import ActsManager from "./ActsManager";

export default class World implements IWorld {
  name: string;
  compendium: (Entity | null)[] = new Array(MAX_ENTITIES).fill(null);
  entityManager = new EntityManager(this);
  actsManager = new ActsManager(this);
  zoneManager = new ZoneManager();

  /**
   * 🟢 Load game world areas, zones, and 100k+ global entities
   */
  async load(worldPath: string): Promise<void> {
    Log.WORLD.INFO("Loading areas, zones, entities, and acts...");
    try {
      const worldData: WorldData = await fetchWorld(worldPath);
      this.name = worldData.name;
      this.zoneManager.areas = worldData.areas;
      this.zoneManager.zones = worldData.zones;
      this.entityManager.load(worldData.entities);
      this.actsManager.load(worldData.actsRegistry);
    } catch (error) {
      Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    }
  }

  // 🟢 Connect character to the game world!
  async connect(character: Character): Promise<void> {
    try {
      // Load character AOI and mark state as dirty.
      await this.zoneManager.initializeAOI(character);

      this.spawn(character);
    } catch (error) {
      Log.WORLD.ERROR(`Could not connect character! ${error}`);
    }

    Log.WORLD.INFO(`${character.name} has entered the world!`);
  }

  // 🟢 Spawn entity in the game world
  public spawn(entity: Entity, transform?: Transform2D, zoneId?: number): void {
    // Update local state
    if (transform?.position) {
      entity.transform.position = {
        x: transform.position.x,
        y: transform.position.y,
      };
    }
    if (transform?.rotation) {
      entity.transform.rotation = transform.rotation;
    }

    // Mark character dirty
    // this.entityManager.markDirty(entity.id, EntityFlags.SPAWNED);
  }
}
