import type Area from "~/core/Area";
import type Character from "~/core/Character";
import MapCache from "~/core/MapCache";

export default class World {
  areas = new Map<string, Area>();
  characters = new Map<number, Character>();
  dirtyEntities = new Set<number>();
  mapCache: MapCache = new MapCache();

  constructor(worldPath: string) {
    // load world data
  }

  addArea(area: Area): void {
    this.areas.set(area.id, area);
  }
  add(character: Character): void {
    if (!this.characters.has(character.id)) return;

    this.characters.set(character.id, character);
    this.markDirty(character.id);
  }
  get(id: number): Character | undefined {
    return this.characters.get(id);
  }
  markDirty(id: number): void {
    this.dirtyEntities.add(id);
  }
  clearDirty(): void {
    this.dirtyEntities.clear();
  }
}
