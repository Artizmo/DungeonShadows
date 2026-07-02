import type { IArea } from "~/shared/core/types";
import type Zone from "~/core/Zone";

export default class Area implements IArea {
  public id!: number;
  public name!: string;
  public description!: string;
  public _zone!: Zone;

  constructor(id: number, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  public set zone(zone: Zone) {
    this._zone = zone;
  }

  public tick(tick: number): void {
    this._zone.tick(tick);
  }
}
