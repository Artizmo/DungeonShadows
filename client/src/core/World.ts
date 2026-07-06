import type { IWorld } from "~/shared/core/types";
import type Area from "~/core/Area";
import type Character from "~/core/Character";

export default class World implements IWorld {
  public areas = new Map<string, Area>();
  public characters = new Map<string, Character>();
  public dirtyEntities = new Set<string>();

  addArea(area: Area): void {
    this.areas.set(area.id, area);
  }
  add(char: Character, areaId: string, zoneId: string): void {
    char.areaId = areaId;
    char.zoneId = zoneId;
    this.characters.set(char.id, char);
    this.areas.get(areaId)?.getZone(zoneId)?.addCharacter(char.id);
  }
  get(id: string): Character | undefined {
    return this.characters.get(id);
  }
  markDirty(id: string): void {
    this.dirtyEntities.add(id);
  }
}
