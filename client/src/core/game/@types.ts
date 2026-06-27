import type Game from "~/core/game/Game";
import type Character from "~/core/character/Character";

export interface Config {
  cycleRate: number; // e.g., 0.05 (time increment step per update frame)
  tickRate: number; // e.g., 0.10 (time step per logical network tick)
  cycleSize: number; // e.g., 100000 (maximum bound wrapping constraint for tick ID)
}

export interface Payload<T = any> {
  type: string;
  data?: T;
}

// Use type aliases to keep your domain language (Command/Response) intact
export type Response<T = any> = Payload<T>;
export type Command<T = any> = Payload<T>;

export interface ResponseContext {
  character?: Character;
  game: Game;
  data: Uint8Array;
}

export interface IResponseHandler {
  execute(context: ResponseContext): void | Promise<void>;
}

export type GameEvent = "CHARACTER_UPDATED" | "WORLD_UPDATED" | "TICK";
export type GameListener = (game: Game) => void;
