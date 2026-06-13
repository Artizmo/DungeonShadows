import type World from '~/core/World';
import type Character from '~/core/Character';

export enum GameEventType {
  SLEEP = "SLEEP",
  DRINK = "DRINK",
  DAMAGE = "DAMAGE",
  EFFECT_FADE = "EFFECT_FADE",
  DEATH = "DEATH"
}

export type SleepEvent = { type: GameEventType.SLEEP };
export type DrinkEvent = { type: GameEventType.DRINK; amount: number };
export type DamageEvent = { type: GameEventType.DAMAGE; amount: number };
export type DeathEvent = { type: GameEventType.DEATH };
export type EffectsFadeEvent = { type: GameEventType.EFFECT_FADE, name: string }
export type PendingEvent = SleepEvent | DrinkEvent | DamageEvent | DeathEvent | EffectsFadeEvent;

export interface GameEventContext {
  character: Character;
  world?: World;
  tick?: number;
  event?: PendingEvent;
}

export interface GameEvent {
  name: string;
  tick: (ctx: GameEventContext) => void;
}