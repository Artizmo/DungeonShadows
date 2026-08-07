import { Log } from "~/shared/core/Logger";
import Character from "~/core/Character";
// import EntityManager from "~/core/EntityManager";
import ZoneManager from "~/core/ZoneManager";
import ActsManager from "./ActsManager";
import StateManager, { type CharacterTargetState } from "./StateManager";
import { fetchWorld, type WorldData } from "~/utils/fetchWorld";
import { MAX_CHARACTERS, MAX_ENTITIES } from "~/shared/core/constants";

import {
  EntityFlags,
  ZoneFlags,
  type Entity,
  type Transform2D,
} from "~/shared/core/types";

export default class World {
  name: string = "";
  compendium: (Entity | null)[] = new Array(MAX_ENTITIES).fill(null);
  characters: (Character | null)[] = new Array(MAX_CHARACTERS).fill(null);

  public readonly actsManager: ActsManager;
  // public readonly entityManager: EntityManager;
  public readonly zoneManager: ZoneManager;
  public readonly state: StateManager; // 🟢 Exposed as public manager on World

  constructor() {
    this.state = new StateManager(this);
    // this.entityManager = new EntityManager(this); // Cleaned: no StateManager dep
    this.zoneManager = new ZoneManager();
    this.actsManager = new ActsManager(this, this.state);
  }

  /**
   * 🟢 Load game world areas, zones, and global entities
   */
  public async load(worldPath: string): Promise<void> {
    Log.WORLD.INFO("Loading areas, zones, entities, and acts...");
    try {
      const worldData: WorldData = await fetchWorld(worldPath);
      this.name = worldData.name;
      this.zoneManager.areas = worldData.areas;
      this.zoneManager.zones = worldData.zones;
      this.loadCompendium(worldData.entities);
      this.actsManager.load(worldData.actsRegistry);
    } catch (error) {
      Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    }
  }

  /**
   * 🟢 Connect character to the game world!
   */
  public async connect(character: Character): Promise<void> {
    try {
      this.characters[character.id] = character;
      this.spawnCharacter(character);
    } catch (error) {
      Log.WORLD.ERROR(`Could not connect character! ${error}`);
    }

    Log.WORLD.INFO(`${character.name} has entered the world!`);
  }

  /**
   * 🟢 Connect character to the game world!
   */
  public disconnect(characterId: number): void {
    const character = this.characters[characterId];

    try {
      this.despawnCharacter(character.id);
      this.characters[characterId] = null;
    } catch (error) {
      Log.WORLD.ERROR(
        `Hard disconnect for character ${character.name}. ${error}!`
      );
    }

    Log.WORLD.INFO(`${character.name} has left the world!`);
  }

  /**
   * 🟢 Spawn / reposition character in the game world
   */
  public spawnCharacter(
    character: Character,
    transform?: Transform2D,
    zoneId?: string
  ): void {
    // Update local character state
    if (zoneId) {
      character.zoneId = zoneId;
    }
    if (transform?.position) {
      character.transform.position.x = transform.position.x;
      character.transform.position.y = transform.position.y;
    }
    if (transform?.rotation !== undefined) {
      character.transform.rotation = transform.rotation;
    }

    // 2. Place in physical Zone spatial grid
    this.zoneManager.spawnEntity(
      character.id,
      character.transform.position.x,
      character.transform.position.y,
      character.zoneId
    );

    // 3. Register camera Area of Interest (AOI)
    this.zoneManager.register(character);

    // 4. Update replication target state
    const targetState = this.state.getTargetState(character.id);

    // Mark Zone metadata as required
    targetState.zone.mark(0, ZoneFlags.ZONED);

    // Mark all entities within visible AOI range as SPAWNED
    this.zoneManager.forEachVisibleEntity(character, (entityId: number) => {
      targetState.entities.mark(entityId, EntityFlags.SPAWNED);
    });

    // Mark local character as SPAWNED
    targetState.character.mark(0, EntityFlags.SPAWNED);
  }

  public despawnCharacter(characterId: number): void {}

  public getSnapshot(characterId: number, tick: number): any {
    return this.state.snapshot(characterId, tick);
  }

  public getCharacterState(characterId: number): CharacterTargetState {
    return this.state.getTargetState(characterId);
  }

  public clearState(characterId: number): void {
    this.state.clearTarget(characterId);
  }

  private loadCompendium(entities: Map<number, Entity>): void {
    for (const [id, entity] of entities.entries()) {
      this.compendium[id] = entity;
    }
  }
}
