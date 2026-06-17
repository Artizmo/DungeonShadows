import * as fs from "fs";
import Log from "~/core/Logger";
import { ZoneData, Collider, ZoneItem } from "~/@types/world";

export default class Zone {
  public id: string = "";
  public parentAreaId: string = "";
  public name: string = "";
  public mapWidth: number = 0;
  public mapHeight: number = 0;
  public mapFile: string = "";
  public colliders: Collider[] = [];
  public items: ZoneItem[] = [];

  constructor(zoneJsonPath: string) {
    this.loadZoneData(zoneJsonPath);
  }

  private loadZoneData(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File completely missing at path: ${filePath}`);
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const data: ZoneData = JSON.parse(raw);

      this.id = data.id;
      this.parentAreaId = data.parentAreaId;
      this.name = data.name;
      this.mapWidth = data.map.width;
      this.mapHeight = data.map.height;
      this.mapFile = data.map.file;
      this.colliders = data.colliders || [];
      this.items = data.items || [];

      Log.WORLD.INFO(`  └─${this.name}`);
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading individual zone asset [${filePath}]: ${error.message}`,
      );
      throw error;
    }
  }
}
