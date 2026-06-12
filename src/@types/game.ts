import type Player from "~/core/Player";
import type Game from "~/core/Game";

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  speed: number;
}


export interface Command {
  type: string;
  data?: any;
}

export interface CommandContext {
  player: Player;
  game: Game;
  data?: any;
}

export interface ICommandHandler {
  execute(ctx: CommandContext): void | Promise<void>;
}