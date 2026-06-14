import type World from '~/core/World';
import type Character from '~/core/Character';

export enum GameEventType {
  DAMAGE = "DAMAGE",
  EFFECT = "EFFECT",
  DEATH = "DEATH"
}

export type DamageEvent = { type: GameEventType.DAMAGE; amount: number };
export type DeathEvent = { type: GameEventType.DEATH };
export type EffectsEvent = { type: GameEventType.EFFECT, name: string }
export type PendingEvent = DamageEvent | DeathEvent | EffectsEvent;

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