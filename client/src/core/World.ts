import type Area from "~/core/Area";
import type Character from "~/core/Character";
import type { StateRecord } from "~/core/types";
import type { IRenderableEntity } from "./Renderer"; // Adjust path as needed

export default class World {
  public areas = new Map<string, Area>();
  public character!: Character;
  private stateHistory: Array<StateRecord> = [];

  // 🟢 NEW: Store all surrounding entities (NPCs, other players, items)
  public entities = new Map<number, IRenderableEntity>();

  add(character: Character): void {
    this.character = character;
  }

  addState(stateRecord: StateRecord): void {
    this.stateHistory.push(stateRecord);
  }
}
