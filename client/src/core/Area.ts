import type Zone from "~/core/Zone";

export default class Area {
  public id: string;
  public zones: Map<string, Zone>;

  constructor(id: string) {
    this.id = id;
    this.zones = new Map();
  }
  addZone(zone: Zone): void {
    this.zones.set(zone.id, zone);
  }
  getZone(zoneId: string): Zone | undefined {
    return this.zones.get(zoneId);
  }
}
