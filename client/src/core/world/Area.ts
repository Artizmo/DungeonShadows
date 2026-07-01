import Zone from "~/core/world/Zone";
import type { IArea } from "~/shared/types";

export default class Area implements IArea {
  public id!: number;
  public name!: string;
  public description!: string;
  public zones: Map<string, Zone> = new Map();
}
