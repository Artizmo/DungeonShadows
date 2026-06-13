import { Area, SavedWorld } from "~/@types/world";
import type Character from '~/core/Character';
import type Game from './Game';
import Log from "~/core/Logger";
import Save from './Save';
import EffectsManager from './EffectsManager';
import EventsManager from './EventsManager';

export default class World {
  public name: string;
  public game: Game;
  private saveManager = new Save();
  public characters: Map<number, Character> = new Map();
  public areas: Map<number, Area>;
  public charactersWithEvents: Set<number> = new Set();

  constructor(savedWorld: SavedWorld, game: Game) {
    this.name = savedWorld.name;
    this.areas = savedWorld.areas;
    this.game = game;
    Log.WORLD.INFO("Loading world!");
  }

  public update(tick: number): void {
    for (const character of this.characters.values()) {
      character.update(tick);
    }
  }

  public tick(tick: number): void {
    const charactersState: any[] = [];

    for (const charId of this.charactersWithEvents) {
      const character = this.characters.get(charId);

      if (!character || (!character.hasPendingEvents && !character.hasActiveEffects)) {
        this.removeCharacterWithEvents(charId);
        continue;
      }

      if (character.hasPendingEvents) {
        EventsManager.tick(character, tick, this);
      }

      if (character.hasActiveEffects) {
        EffectsManager.tick(character, tick, this);
      }

      character.tick(tick);

      const snapshot = character.getCharacterSnapshot();
      if (snapshot) {
        charactersState.push(snapshot);
      }
    }

    if (charactersState.length > 0) {
      this.game.server.broadcast("WORLD_SYNC", {
        tick,
        entities: charactersState
      });
    }
  }

  public async save(character: Character): Promise<void> {
    if (!character) throw "Character not valid.";
    if (!this.characters.has(character.id)) {
      throw "Character not found in world.";
    }

    try {
      this.saveManager.saveCharacter(character);
    } catch (e) {
      throw e;
    }
  }

  public join(character: Character): void {
    if (!character) return;

    if (this.characters.has(character.id)) {
      throw new Error("Character is already in the world.");
    }

    character.onAppliedEffect = charId => this.queueCharacterWithEvents(charId);
    character.onAppliedEvent = charId => this.queueCharacterWithEvents(charId);
    this.addCharacter(character);
  }

  public leave(character: Character): void {
    if (!character) return;

    if (!this.characters.has(character.id)) {
      throw "Character is not in the world.";
    }

    this.removeCharacter(character);
  }

  public addCharacter(character: Character): void {
    this.characters.set(character.id, character);
  }

  public removeCharacter(character: Character): void {
    this.characters.delete(character.id);
  }

  public queueCharacterWithEvents(charId: number): void {
    this.charactersWithEvents.add(charId);
  }

  public removeCharacterWithEvents(charId: number): void {
    this.charactersWithEvents.delete(charId);
  }
}