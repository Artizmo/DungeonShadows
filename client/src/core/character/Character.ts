import type { Effect, Position, Stats } from "~/core/character/@types";
import type { IPlayer } from "~/core/character/Player";
import type Player from "~/core/character/Player";
import type Zone from "../world/Zone";

export interface ICharacter {
  id: number;
  name: string;
  isAlive: boolean;
  player: IPlayer;
}

export default class Character implements ICharacter {
  public id: number;
  public player!: Player;
  public name: string;
  public level!: number;
  public zone!: Zone;
  public position!: Position;
  public stats!: Stats;
  public isAlive: boolean;
  public effects: Map<string, Effect> = new Map();
  public onPendingEvent?: (charId: number) => void;
  constructor(character: Character) {
    this.id = character.id;
    this.player = character.player;
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
  }

  public tick() {}
}
