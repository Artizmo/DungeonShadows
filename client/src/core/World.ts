import type Area from "~/core/Area";
import type Character from "~/core/Character";

export default class World {
  public areas = new Map<string, Area>();
  public character!: Character;
  public dirtyEntities = new Set<string>();

  addArea(area: Area): void {
    this.areas.set(area.id, area);
  }
  add(character: Character): void {
    this.character = character;
  }
  get(): Character {
    return this.character;
  }
  markDirty(id: string): void {
    this.dirtyEntities.add(id);
  }
}
