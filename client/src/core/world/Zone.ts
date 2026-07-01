import type { IZone } from "~/shared/types";

export default class Zone implements IZone {
  public id!: string;
  public areaId!: string;
  public mapPath!: string;
}
