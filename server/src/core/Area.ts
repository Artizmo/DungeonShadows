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

  public addZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }

  public getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }
}
