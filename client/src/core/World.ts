import type Area from "~/core/Area";
import type Character from "~/core/Character";
import type { StateRecord } from "~/core/types";

export default class World {
  public areas = new Map<string, Area>();
  public character!: Character;
  private stateHistory: Array<StateRecord> = [];

  add(character: Character): void {
    this.character = character;
  }

  addState(stateRecord: StateRecord): void {
    this.stateHistory.push(stateRecord);
  }
}
