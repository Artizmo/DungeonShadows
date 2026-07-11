import type Area from "~/core/Area";
import type Character from "~/core/Character";

export default class World {
  public areas = new Map<string, Area>();
  public character!: Character;

  addArea(area: Area): void {
    this.areas.set(area.id, area);
  }
  add(character: Character): void {
    this.character = character;
  }
}
