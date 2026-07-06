import { fetchConfigData } from "~/_utils/functions/fetchWorld";
import { Log } from "~/shared/core/Logger";
import { Collider, ZoneItem } from "~/core/types";

export default class Zone {
  public id: string = "";
  public areaId: string = "";
  public name: string = "";
  public mapName: string = "";
  public colliders: Collider[] = [];
  public items: ZoneItem[] = [];
  public characterIds: Set<number>;

  constructor(zonePath: string) {
    this.load(zonePath);
  }

  private load(zonePath: string): void {
    try {
      const zone = fetchConfigData<any>(zonePath, "zone manifest");

      this.id = zone.id;
      this.name = zone.name;
      this.areaId = zone.areaId;
      this.mapName = zone.map.file;
      this.colliders = zone.colliders;
      this.items = zone.items;

      Log.WORLD.INFO(`  └─${this.name}`);
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${zonePath}]: ${error.message}`,
      );
    }
  }

  addCharacter(id: number): void {
    this.characterIds.add(id);
  }
  removeCharacter(id: number): void {
    this.characterIds.delete(id);
  }
  get characterCount(): number {
    return this.characterIds.size;
  }
}
