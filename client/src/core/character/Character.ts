import type {
  IPendingAction,
  ICharacter,
  IPlayer,
  IZone,
  ICoords,
  IStats,
} from "~/shared/types";

export default class Character implements ICharacter {
  public id: number;
  public player: IPlayer;
  public name: string;
  public level: number;
  public zone: IZone;
  public position: ICoords;
  public renderPosition: ICoords;
  public stats: IStats;
  public isAlive: boolean;
  public pendingActions: IPendingAction<any>[] = [];
  public speed: number = 3.6;
  public sequenceId: number = 0;
  private LERP_FACTOR: number = 0.65;

  constructor(character: ICharacter) {
    this.id = character.id;
    this.player = { ...character.player };
    this.name = character.name;
    this.level = character.level;
    this.zone = { ...character.zone };
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.renderPosition = { ...this.position };
  }

  public update(deltaTime: number): void {
    // Smoothly slide visual coordinates toward the logical ground truth
    this.renderPosition.x +=
      (this.position.x - this.renderPosition.x) * this.LERP_FACTOR;
    this.renderPosition.y +=
      (this.position.y - this.renderPosition.y) * this.LERP_FACTOR;

    // Prevent micro-float precision decay
    if (Math.abs(this.position.x - this.renderPosition.x) < 0.001)
      this.renderPosition.x = this.position.x;
    if (Math.abs(this.position.y - this.renderPosition.y) < 0.001)
      this.renderPosition.y = this.position.y;
  }

  public tick(tick: number) {}
}
