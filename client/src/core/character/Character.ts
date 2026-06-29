import type { Effect, Position, Stats } from "~/core/character/@types";
import Player from "~/core/character/Player";
import type Zone from "../world/Zone";
import type InputHandler from "../InputHandler";
import type { IPendingAction, IPlayer } from "~/shared/serialize/@types";

export interface ICharacter {
  id: number;
  name: string;
  isAlive: boolean;
  player: IPlayer;
  level: number;
  zone: Zone;
  position: Position;
  stats: Stats;
}

export default class Character implements ICharacter {
  public id: number;
  public player: Player;
  public name: string;
  public level: number;
  public zone: Zone;
  public position: Position;
  public stats: Stats;
  public isAlive: boolean;
  public effects: Map<string, Effect> = new Map();
  public pendingActions: IPendingAction<any>[] = [];
  public speed: number = 0.06;
  private sequenceId: number = 0;

  constructor(character: ICharacter) {
    this.id = character.id;
    this.player = new Player(character.player);
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
  }

  // public handleInputMovement(input: InputHandler): void {
  //   if (input.keys.w) this.position.y -= this.speed;
  //   if (input.keys.s) this.position.y += this.speed;
  //   if (input.keys.a) this.position.x -= this.speed;
  //   if (input.keys.d) this.position.x += this.speed;
  // }

  public handleInputMovement(input: InputHandler): void {
    const isMoving =
      input.keys.w || input.keys.s || input.keys.a || input.keys.d;
    if (!isMoving) return;

    this.sequenceId++;

    const action: IPendingAction = {
      type: "MOVE",
      sequenceId: this.sequenceId,
      payload: { ...input.keys },
    };

    // 1. Queue it
    this.pendingActions.push(action);

    // 2. Predict it locally
    if (action.payload.w) this.position.y -= this.speed;
    if (action.payload.s) this.position.y += this.speed;
    if (action.payload.a) this.position.x -= this.speed;
    if (action.payload.d) this.position.x += this.speed;
  }

  public tick(tick: number) {}
}
