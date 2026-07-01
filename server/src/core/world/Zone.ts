import { fetchConfigData } from "~/_utils/functions/fetchWorld";
import { Log } from "~/shared/core/Logger";
import { Collider, ZoneItem } from "~/core/world/types";

export default class Zone {
  public id: string = "";
  public parentAreaId: string = "";
  public name: string = "";
  public mapWidth: number = 0;
  public mapHeight: number = 0;
  public mapFile: string = "";
  public colliders: Collider[] = [];
  public items: ZoneItem[] = [];

  constructor(zonePath: string) {
    this.load(zonePath);
  }

  private load(zonePath: string): void {
    try {
      const zone = fetchConfigData<any>(zonePath, "zone manifest");

      this.id = zone.id;
      this.name = zone.name;
      this.parentAreaId = zone.parentAreaId;
      this.mapWidth = zone.map.width;
      this.mapHeight = zone.map.height;
      this.mapFile = zone.map.file;
      this.colliders = zone.colliders;
      this.items = zone.items;

      Log.WORLD.INFO(`  └─${this.name}`);
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${zonePath}]: ${error.message}`,
      );
    }
  }
}
