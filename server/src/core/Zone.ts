import * as fs from "fs";
import * as path from "path";
import { Log } from "~/shared/core/Logger";
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

  constructor(zonePath: string) {
    this.load(zonePath);
  }

  private load(zonePath: string): void {
    try {
      const zone = JSON.parse(fs.readFileSync(zonePath, "utf-8"));

      this.id = zone.id;
      this.name = zone.name;

      Log.WORLD.INFO(`  └─${this.name}`);
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${zonePath}]: ${error.message}`,
      );
      throw error;
    }
  }
}
