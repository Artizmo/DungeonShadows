import { Area, SavedWorld } from "~/@types/world";
import type Character from '~/core/Character';
import type Game from './Game';
import Log from "~/core/Logger";
import EffectsManager from './EffectsManager';
import { broadcast } from '~/utils/messageBroker';

export default class World {
  public name: string;
  public game: Game;
  public characters: Map<number, Character> = new Map();
  public areas: Map<number, Area>;
  public charactersWithEvents: Set<number> = new Set();

  constructor(savedWorld: SavedWorld, game: Game) {
    this.name = savedWorld.name;
    this.game = game;
    Log.WORLD.INFO("Loading world!");
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

      if (!character || (!character.hasPendingEvents && !character.hasActiveEffects)) {
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
          entities: charactersState
        }
      });
    }
  }

  public join(character: Character): void {
    if (!character) return;

    if (this.characters.has(character.id)) {
      throw new Error("Character is already in the world.");
    }

    character.onPendingEvent = charId => {
      this.charactersWithEvents.add(charId);
    }
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