import type { Effect, Position, Stats } from "~/core/character/@types";
import type { IPlayer } from "~/core/character/Player";
import Player from "~/core/character/Player";
import type Zone from "../world/Zone";
import type InputHandler from "../InputHandler";

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
  public onPendingEvent?: (charId: number) => void;
  private speed: number = 0.06;

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

  public handleInputMovement(input: InputHandler): void {
    if (input.keys.w) this.position.y -= this.speed;
    if (input.keys.s) this.position.y += this.speed;
    if (input.keys.a) this.position.x -= this.speed;
    if (input.keys.d) this.position.x += this.speed;
  }

  public tick() {}
}
