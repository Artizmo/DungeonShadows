import * as fs from "fs";
import * as path from "path";
import EffectsManager from "~/core/EffectsManager";
import { Log } from "~/shared/core/Logger";
import Area from "~/core/Area";
import { send } from "~/utils/messageBroker";
import type Character from "~/core/Character";
import type Game from "~/core/Game";

interface WorldConfig {
  name: string;
  areas: {
    id: string;
    areaPath: string;
  }[];
}
export default class World {
  public name: string;
  public characters: Map<number, Character> = new Map();
  public areas: Map<number, Area> = new Map();
  public charactersWithEvents: Set<number> = new Set();

  constructor(worldPath: string) {
    Log.WORLD.INFO("Loading world...");
    try {
      this.load(worldPath);
      Log.WORLD.INFO("Loaded world!");
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }

  private load(worldPath: string): void {
    try {
      const worldData = path.join(process.cwd(), "../shared", worldPath);

      if (!fs.existsSync(worldData)) {
        throw new Error(
          `Master configuration target ledger missing at: ${worldData}`,
        );
      }

      try {
        const raw = fs.readFileSync(worldData, "utf-8");
        const world: WorldConfig = JSON.parse(raw);

        this.name = world.name;

        if (world.areas) {
          for (const { areaPath } of world.areas) {
            const area = new Area(areaPath);
            this.areas.set(area.id, area);
          }
        }
      } catch (error: any) {
        Log.WORLD.ERROR(
          `Failed parsing master world tree hierarchy: ${error.message}`,
        );
      }
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed parsing master world tree hierarchy: ${error.message}`,
      );
      throw error;
    }
  }

  public update(tick: number): void {
    for (const character of this.characters.values()) {
      character.update(tick);
    }
  }

  public tick(tick: number): void {
    if (this.charactersWithEvents.size === 0) return;

    for (const charId of [...this.charactersWithEvents]) {
      const character = this.characters.get(charId);

      if (
        !character ||
        (!character.hasPendingEvents && !character.hasActiveEffects)
      ) {
        this.charactersWithEvents.delete(charId);
        continue;
      }

      // 1. Run physics, inputs, and character updates
      character.tick(tick);

      // 2. Process active status effects
      if (character.hasActiveEffects) {
        EffectsManager.tick(character, tick, this);
      }

      // 3. Extract this specific character's isolated frame snapshot
      const snapshot = character.getCharacterSnapshot();

      if (snapshot) {
        // Send a private, targeted packet directly back to the origin character
        send(character.player.id, { character: snapshot });
      }

      // 4. Clean up active loop tracking if their event/effect state has settled
      if (!character.hasPendingEvents && !character.hasActiveEffects) {
        this.charactersWithEvents.delete(charId);
      }
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
    send(character.player.id, { success: true });
    Log.WORLD.INFO(`${character.name} has entered the world!`);
  }

  public leave(character: Character): void {
    if (!character) return;

    if (!this.characters.has(character.id)) {
      throw "Character is not in the world.";
    }

    this.charactersWithEvents.delete(character.id);
    this.characters.delete(character.id);
    Log.WORLD.INFO(`${character.name} has left the world.`);
  }
}
