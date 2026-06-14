import type Character from '~/core/Character';
import type World from '~/core/World';

export enum EffectType {
  POISON = "POISON"
}

export interface Effect {
  name: string;
  type: EffectType;
  duration: number;
  density: number;
  interval?: number;
  applyMessage?: string;
  resolveMessage?: string;
  tick?: (ctx: EffectContext) => void;
}

export interface EffectContext {
  character: Character;
  effect: Effect;
  world?: World;
  tick?: number;
}