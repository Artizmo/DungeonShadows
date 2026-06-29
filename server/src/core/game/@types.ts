import { WebSocket } from "ws";
import type Player from "~/core/character/Player";
import type Game from "~/core/game/Game";
import type World from "~/core/world/World";
import type Character from "~/core/character/Character";
import type { IPendingAction } from "~/shared/serialize/@types";

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
  MOVE = "MOVE",
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

export type MoveCommandEvent = {
  type: GameEventType.MOVE;
  sequenceId: number;
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
};

export type MoveEvent = {
  type: GameEventType.MOVE;
  characterId: number;
  x: number;
  y: number;
  lastProcessedId: number;
};

export type PendingEvent =
  | DamageEvent
  | DeathEvent
  | EffectsEvent
  | CharacterEvent
  | MoveEvent;

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

// 1. For actions where the player is already fully initialized in the world
export interface RequestContext {
  character: Character;
  game: Game;
  data: Uint8Array; // Raw FlatBuffer bytes specific to this action
}

export interface IConnection {
  send(data: Uint8Array): void;
  disconnect(): void;
}

// 2. 🟢 For login/join actions where the Player instance does NOT exist yet
export interface ConnectionContext {
  connection: IConnection;
  playerId: number;
  characterId: number;
}

export interface IRequestHandler {
  execute(context: RequestContext): void | Promise<void>;
}

export interface IConnectionHandler {
  execute(context: ConnectionContext): Promise<void>;
}

export interface EffectContext {
  game: any;
  targetCharacter: any;
  elapsedTicks: number;
}

export interface IEffectHandler {
  tick(context: EffectContext): void;
  expire(context: EffectContext): void;
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

export type GameEventMap = {
  PLAYER_JOIN: { playerId: string; characterId: string; connection: any };
  PLAYER_MOVE: { playerId: string; x: number; y: number };
  APPLY_EFFECT: { targetId: string; duration: number };
  CLIENT_BATCH_INPUT: IPendingAction;
};

// 🟢 A generic handler interface bound to a specific event key
export interface IGameHandler<K extends keyof GameEventMap> {
  execute(payload: GameEventMap[K]): void | Promise<void>;
}

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
