import * as fs from "fs";
import * as path from "path";
import Log from "~/shared/core/Logger";
import Zone from "~/core/Zone";

interface RawAreaJson {
  id: number;
  name: string;
  description: string;
  zones: { id: string; dataPath: string }[];
}

export default class Area {
  public id: number;
  public name: string;
  public description: string;
  public zones: Map<string, Zone> = new Map();

  constructor(areaFolderPath: string) {
    this.loadAreaAndZones(areaFolderPath);
  }

  private loadAreaAndZones(areaFolderPath: string): void {
    try {
      const areaJsonPath = path.join(areaFolderPath, "area.json");

      if (!fs.existsSync(areaJsonPath)) {
        throw new Error(
          `Expected area configuration manifest at: ${areaJsonPath}`,
        );
      }

      const raw = fs.readFileSync(areaJsonPath, "utf-8");
      const data: RawAreaJson = JSON.parse(raw);

      this.id = data.id;
      this.name = data.name;
      this.description = data.description || "";

      Log.WORLD.INFO(`└─Area: ${this.name}`);

      // Recursively stream internal zone layers from the child directory
      if (data.zones) {
        for (const zoneRef of data.zones) {
          // Resolve relative internal schema paths safely to absolute filesystem targets
          const normalizedZonePath = path.resolve(
            path.dirname(areaJsonPath),
            zoneRef.dataPath,
          );

          const zoneInstance = new Zone(normalizedZonePath);
          this.zones.set(zoneInstance.id, zoneInstance);
        }
      }
    } catch (error: any) {
      Log.WORLD.ERROR(
        `Failed loading area manifest from [${areaFolderPath}]: ${error.message}`,
      );
      throw error;
    }
  }
}
