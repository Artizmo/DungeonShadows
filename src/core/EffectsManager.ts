import { EffectType, type ActiveEffect, type Effect } from '~/@types/effects';
import type World from "~/core/World";
import type Character from "~/core/Character";
import Log from './Logger';
import { poisonEffect } from '~/lib/effects/poison';

export default class EffectsManager {
  private static registry: Map<string, Effect> = new Map([
    [EffectType.POISON, poisonEffect]
  ]);

  public static tick(character: Character, _tick: number, _world: World): void {
    const expiredEffects: string[] = [];

    if (character.isDead) {
      character.activeEffects.clear();
      return;
    }

    for (const [effectName, activeEffect] of character.activeEffects) {
      const effect = this.registry.get(effectName);

      if (!effect) {
        Log.CHAR.ERROR(`Unknown effect script: ${effectName}`);
        expiredEffects.push(effectName);
        continue;
      }

      if (activeEffect.duration > 0) {
        activeEffect.duration--;
      }

      effect.tick({ character, activeEffect });

      if (activeEffect.duration <= 0) {
        expiredEffects.push(effectName);
        if (effect.remove) effect.remove({ activeEffect, character });
      }

    }

    for (const effectName of expiredEffects) {
      character.activeEffects.delete(effectName);
    }
  }

  public static apply(character: Character, activeEffect: ActiveEffect): void {
    const effect = this.registry.get(activeEffect.type);

    if (!effect) {
      Log.CHAR.ERROR(`Unknown effect script: ${activeEffect.type}`);
      return;
    }

    const clampedDensity = Math.max(1, Math.min(10, activeEffect.density));
    activeEffect.interval = clampedDensity === 10
      ? 1
      : Math.round(Math.pow(11 - clampedDensity, 1.0 + Math.random()) * 6);
    character.activeEffects.set(activeEffect.type, activeEffect);

    // const clampedDensity = Math.max(1, Math.min(10, activeEffect.density));

    // // 🟢 Predictable mathematical bounds:
    // // Density 10 = ticks every 1 frame
    // // Density 3  = ticks every 24 frames
    // // Density 1  = ticks every 30 frames
    // activeEffect.interval = clampedDensity === 10
    //   ? 1
    //   : (11 - clampedDensity) * 3;

    character.activeEffects.set(activeEffect.type, activeEffect);
    effect.apply({ activeEffect, character });
    // effect.tick({ character, activeEffect });
  }
}