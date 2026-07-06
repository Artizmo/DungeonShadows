import type { GameEntity } from "~/shared/core/types";

export default class Character implements GameEntity {
  public lastCastTimestamp = 0;
  constructor(
    public id: string,
    public x: number,
    public y: number,
    public health = 100,
    public mana = 100,
    public areaId: string | null = null,
    public zoneId: string | null = null,
  ) {}
}
