import * as fs from "fs";
import * as path from "path";
import { Log } from "~/shared/core/Logger";
import Zone from "~/core/Zone";

export default class Area {
  public id: number;
  public name: string;
  public description: string;
  public zones: Map<string, Zone> = new Map();

  constructor(areaPath: string) {
    this.load(areaPath);
  }

  private load(areaPath: string): void {
    try {
      const finalPath = path.join(
        process.cwd(),
        "../shared/data/world",
        areaPath,
      );
      const area = JSON.parse(fs.readFileSync(finalPath, "utf-8"));

      this.id = area.id;
      this.name = area.name;
      this.description = area.description;

      Log.WORLD.INFO(`└─Area: ${this.name}`);

      if (area.zones) {
        for (const { zonePath } of area.zones) {
          const finalZonePath = path.join(path.dirname(finalPath), zonePath);
          const zone = new Zone(finalZonePath);
          this.zones.set(zone.id, zone);
        }
      }
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${areaPath}]: ${error.message}`,
      );
      throw error;
    }
  }
}
