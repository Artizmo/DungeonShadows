import type Area from "~/core/Area";
import type Character from "~/core/Character";
import type { ActionType } from "~/shared/core/types";
import type { WorldState } from "./types";

export default class World {
  public areas = new Map<string, Area>();
  public character!: Character;
  private stateHistory: Array<{
    // move to world class
    sequenceId: number;
    tick: number;
    actions: Set<ActionType>;
    state: WorldState;
  }> = [];

  add(character: Character): void {
    this.character = character;
  }
}
