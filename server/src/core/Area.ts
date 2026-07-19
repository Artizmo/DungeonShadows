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
  zones: Map<string, Zone>;

  constructor(area: Area) {
    this.id = area.id;
    this.name = area.name;
    this.description = area.description;
    this.zones = new Map();
  }

  /**
   * Initializes all zones belonging to this area based on the provided configuration.
   */
  public async initialize(zoneConfig: ZoneConfig[]): Promise<void> {
    Log.WORLD.INFO(`[Area: ${this.id}] Initializing zones...`);

    for (const { zonePath } of zoneConfig) {
      const zoneData = JSON.parse(
        await readFile(
          `../shared/data/world/areas/${this.id}/zones/${zonePath}`,
          "utf-8",
        ),
      );

      // 1. Instantiate the Zone class passing the required context
      const zone = new Zone(zoneData);

      // 2. Instruct the zone to build out its 256x256 px abstract bucket grid
      await zone.initBucketGrid();

      // 3. Add the initialized zone to this Area's map context
      this.addZone(zone);
    }
  }

  public addZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }

  public getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }
}
