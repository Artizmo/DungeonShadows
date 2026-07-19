import type Zone from "~/core/Zone";

export default class Area {
  id: string;
  author: string;
  description: string;
  zones: Map<string, Zone>;

  constructor(area: Area) {
    this.id = area.id;
    this.author = area.author;
    this.description = area.description;
    this.zones = new Map();
  }
  addZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }
  getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }
}
