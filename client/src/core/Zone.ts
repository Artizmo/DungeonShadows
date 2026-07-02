import type { IZone } from "~/shared/core/types";

export default class Zone implements IZone {
  public id!: string;
  public areaId!: string;
  public mapName!: string;

  public tick(tick: number): void {
    // Implement zone-specific logic here
  }
}
