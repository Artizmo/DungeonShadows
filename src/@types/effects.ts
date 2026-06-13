import type Character from '~/core/Character';
import type World from '~/core/World';

export enum EffectType {
  POISON = "POISON"
}

export type ActiveEffect = {
  duration: number;
  density: number;
  interval?: number;
  type: EffectType;
};

export interface ActiveEffectContext {
  character: Character;
  world?: World;
  tick?: number;
  activeEffect?: ActiveEffect;
}

export interface Effect {
  name: string;
  tick: (ctx: ActiveEffectContext) => void;
  apply: (ctx: ActiveEffectContext) => void;
  remove?: (ctx: ActiveEffectContext) => void;
}
