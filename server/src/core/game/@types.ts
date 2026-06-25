import type Player from "~/core/character/Player";
import type Game from "~/core/game/Game";
import type World from "~/core/world/World";
import type Character from "~/core/character/Character";

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
  }
}

export enum GameEventType {
  DAMAGE = "DAMAGE",
  ADD_EFFECT = "ADD_EFFECT",
  REMOVE_EFFECT = "REMOVE_EFFECT",
  DEATH = "DEATH",
  CHARACTER = "CHARACTER",
}

export type DamageEvent = { type: GameEventType.DAMAGE; amount: number };
export type CharacterEvent = {
  type: GameEventType.CHARACTER;
  character: Character;
  tick: number;
};
export type DeathEvent = { type: GameEventType.DEATH };
export type EffectsEvent = {
  type: GameEventType.ADD_EFFECT | GameEventType.REMOVE_EFFECT;
};
export type PendingEvent =
  | DamageEvent
  | DeathEvent
  | EffectsEvent
  | CharacterEvent;

export interface GameEventContext {
  character: Character;
  world?: World;
  tick?: number;
  pendingEvent?: PendingEvent;
}

export interface GameEvent {
  name: string;
  tick: (ctx: GameEventContext) => void;
}

export interface Request {
  type: string;
  data?: any;
}

export interface RequestContext {
  player: Player;
  game: Game;
  data: any; // For structured data (like a UI button click payload)
  args?: string[]; // For tokenized text (like typing "drink waterskin")
}

export interface IRequestHandler {
  execute(context: RequestContext): void | Promise<void>;
}

export interface Command {
  type: string;
  data?: any;
}

export interface CommandContext {
  player: Player;
  game: Game;
  data: any; // For structured data (like a UI button click payload)
  args?: string[]; // For tokenized text (like typing "drink waterskin")
}

export interface ICommandHandler {
  execute(context: CommandContext): void | Promise<void>;
}

import { WebSocket } from "ws";

export interface NetworkMessage {
  type: string;
  data?: any;
  socket: WebSocket;
}

export type Config = {
  name: string;
  version: string;
  port: number;
  worldPath: string;
  fps: number;
  cycleSize: number;
  cycleRate: number;
  tickRate: number;
};
