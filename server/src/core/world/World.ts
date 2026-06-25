import path from "path";
import EffectsManager from "~/core/game/EffectsManager";
import { Log } from "~/shared/core/Logger";
import Area from "~/core/world/Area";
import { send } from "~/_utils/messageBroker";
import Character from "~/core/player/Character";
import { fetchConfigData } from "~/_utils/functions/fetchWorld";
import type { WorldConfig } from "./@types";

export default class World {
  public _name: string;
  public areas: Map<number, Area> = new Map();
  public charactersWithEvents: Set<number> = new Set();
  private _characters: Map<number, Character> = new Map();

  constructor(worldPath: string) {
    Log.WORLD.INFO("Loading world...");
    try {
      this.load(worldPath);
      Log.WORLD.INFO("Loaded world!");
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }

    Character.events.on("eventAdded", (charId: number) => {
      this.handleAddCharacterEvent(charId);
    });
  }

  public set name(name: string) {
    this._name = name;
  }

  public get characters(): Map<number, Character> {
    return this._characters;
  }

  private load(worldPath: string): void {
    try {
      const world = fetchConfigData<WorldConfig>(
        path.join("../shared", worldPath),
      );

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

      if (!character || !character.hasPendingEvents) {
        this.charactersWithEvents.delete(charId);
        continue;
      }

      // 1. Run physics, inputs, and character updates
      // character.tick(tick);

      // 2. Process active effects
      if (character.hasEffects) {
        EffectsManager.tick(character, tick);
      }

      // 3. Extract this specific character's isolated frame snapshot
      const snapshot = character.getCharacterSnapshot();

      if (snapshot) {
        // Send a private, targeted packet directly back to the origin character
        send(character.player.id, { character: snapshot });
      }

      // 4. Clean up active loop tracking if their event/effect state has settled
      if (!character.hasPendingEvents && !character.hasEffects) {
        this.charactersWithEvents.delete(charId);
      }
    }
  }

  public join(character: Character): void {
    if (!character) return;

    if (this.characters.has(character.id)) {
      throw new Error("Character is already in the world.");
    }

    this.characters.set(character.id, character);
    send(character.player.id, { success: true });
    Log.WORLD.INFO(`${character.name} has entered the world!`);
  }

  public leave(character: Character): void {
    if (!character) return;

    if (!this.characters.has(character.id)) {
      throw "Character is not in the world.";
    }

    this.removeCharacterEvent(character.id);
    this.characters.delete(character.id);
    Log.WORLD.INFO(`${character.name} has left the world.`);
  }

  private handleAddCharacterEvent(charId: number): void {
    if (!this.characters.has(charId)) return;

    this.addCharacterEvent(charId);
  }

  private addCharacterEvent(charId: number): void {
    if (!charId) return;

    this.charactersWithEvents.add(charId);
  }

  private removeCharacterEvent(charId: number): void {
    if (!charId) return;

    this.charactersWithEvents.delete(charId);
  }
}
