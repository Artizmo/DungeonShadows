import { readFile } from "node:fs/promises";
import Zone from "~/core/Zone";
import { Log } from "~/shared/core/Logger";

interface ZoneConfig {
  id: string;
  zonePath: string;
}

export default class Area {
  id: string;
  name: string;
  description: string;
  zones: Map<string, Zone> = new Map();

  constructor(areaData: any) {
    this.id = areaData.id;
    this.name = areaData.name;
    this.description = areaData.description;
  }

  public async loadZones(zonesConfig: ZoneConfig[]): Promise<void> {
    for (const [index, zoneConfig] of zonesConfig.entries()) {
      if (!zoneConfig) continue;

      const isLast = index === zonesConfig.length - 1;
      const branchChar = isLast ? "└──" : "├──";

      const zoneData = JSON.parse(
        await readFile(
          `../shared/data/world/areas/${this.id}/zones/${zoneConfig.zonePath}`,
          "utf-8"
        )
      );

      const zone = new Zone(zoneData);
      await zone.initBucketGrid();
      this.addZone(zone);

      Log.WORLD.INFO(
        `${branchChar} ${zone.name}: ${zone.cols}x${zone.rows}, ${zone.buckets.size} buckets.`
      );
    }
  }

  public addZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }

  public getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }
}
