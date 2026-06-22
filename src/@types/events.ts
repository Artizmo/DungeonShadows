import type World from "~/core/World";
import type Character from "~/core/Character";

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
