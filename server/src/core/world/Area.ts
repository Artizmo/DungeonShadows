import path from "path";
import { Log } from "~/shared/core/Logger";
import Zone from "~/core/world/Zone";
import { fetchConfigData } from "~/_utils/functions/fetchWorld";

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
      const area = fetchConfigData<any>(
        path.join("../shared/data/world", areaPath),
      );

      this.id = area.id;
      this.name = area.name;
      this.description = area.description;

      Log.WORLD.INFO(`└─Area: ${this.name}`);

      if (area.zones) {
        for (const { zonePath } of area.zones) {
          const finalAreaPath = path.resolve(
            process.cwd(),
            "../shared/data/world",
            areaPath,
          );
          const absoluteZonePath = path.join(
            path.dirname(finalAreaPath),
            zonePath,
          );

          const zone = new Zone(absoluteZonePath);
          this.zones.set(zone.id, zone);
        }
      }
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${areaPath}]: ${error.message}`,
      );
    }
  }
}
