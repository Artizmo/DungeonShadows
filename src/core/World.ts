import * as fs from "fs";
import * as path from "path";
import EffectsManager from "~/core/EffectsManager";
import Log from "~/core/Logger";
import Area from "~/core/Area";
import { broadcast } from "~/utils/messageBroker";
import type Character from "~/core/Character";
import type Game from "~/core/Game";

interface WorldConfig {
  name: string;
  areas: {
    id: string;
    manifestPath: string;
  }[];
}
export default class World {
  public name: string;
  public game: Game;
  public characters: Map<number, Character> = new Map();
  public areas: Map<number, Area> = new Map();
  public charactersWithEvents: Set<number> = new Set();

  constructor(worldPath: string, game: Game) {
    Log.WORLD.INFO("Loading world...");
    this.game = game;
    try {
      this.loadWorldAndAreas(worldPath);
      Log.WORLD.INFO("Loaded world!");
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }

  /**
   * Reads world.json and kicks off modular area streaming pass
   */
  private loadWorldAndAreas(worldPath: string): void {
    try {
      if (!fs.existsSync(worldPath)) {
        throw new Error(
          `Master configuration target ledger missing at: ${worldPath}`,
        );
      }

      const raw = fs.readFileSync(worldPath, "utf-8");
      const config: WorldConfig = JSON.parse(raw);
      this.name = config.name;

      if (config.areas) {
        for (const areaRef of config.areas) {
          // Calculate the folder path where area.json lives relative to world.json
          const resolvedAreaFolder = path.dirname(
            path.resolve(path.dirname(worldPath), areaRef.manifestPath),
          );

          this.loadAreas(resolvedAreaFolder);
        }
      }
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed parsing master world tree hierarchy: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Instantiates an individual Area node context and indexes it
   */
  public loadAreas(areaFolderPath: string): void {
    const areaInstance = new Area(areaFolderPath);

    if (this.areas.has(areaInstance.id)) {
      throw new Error(
        `Collision Exception! Area key matching id "${areaInstance.id}" has already been processed.`,
      );
    }

    this.areas.set(areaInstance.id, areaInstance);
  }

  public update(tick: number): void {
    for (const character of this.characters.values()) {
      character.update(tick);
    }
  }

  public tick(tick: number): void {
    if (this.charactersWithEvents.size === 0) return;

    const charactersState: any[] = [];

    for (const charId of [...this.charactersWithEvents]) {
      const character = this.characters.get(charId);

      if (
        !character ||
        (!character.hasPendingEvents && !character.hasActiveEffects)
      ) {
        this.charactersWithEvents.delete(charId);
        continue;
      }

      character.tick(tick);

      if (character.hasActiveEffects) {
        EffectsManager.tick(character, tick, this);
      }

      const snapshot = character.getCharacterSnapshot();
      if (snapshot) {
        charactersState.push(snapshot);
      }

      if (!character.hasPendingEvents && !character.hasActiveEffects) {
        this.charactersWithEvents.delete(charId);
      }
    }

    if (charactersState.length > 0) {
      broadcast({
        type: "WORLD_SYNC",
        data: {
          tick,
          entities: charactersState,
        },
      });
    }
  }

  public join(character: Character): void {
    if (!character) return;

    if (this.characters.has(character.id)) {
      throw new Error("Character is already in the world.");
    }

    character.onPendingEvent = (charId) => {
      this.charactersWithEvents.add(charId);
    };
    this.characters.set(character.id, character);
  }

  public leave(character: Character): void {
    if (!character) return;

    if (!this.characters.has(character.id)) {
      throw "Character is not in the world.";
    }

    this.charactersWithEvents.delete(character.id);
    this.characters.delete(character.id);
  }
}
