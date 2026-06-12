import type World from "~/core/World";
import type Character from "~/core/Character";

export enum EffectType {
  POISON = "POISON"
}

let poisonEffect: Effect = {
  name: "POISON",

  onTick({ character, activeEffect }) {
    if (character.isDead) {
      character.activeEffects.delete("poison");
      character.logger.info(`${character.name} is dead!`);
      return;
    };

    if (activeEffect.duration % activeEffect.interval === 0) {
      character.damage(5);
      character.logger.info(`${character.name} takes 5 poison damage. Current HP: ${character.stats.hp} (Ticks Remaining: ${activeEffect.duration})`);
    }
  },

  onRemove({ character }) {
    character.pendingEvents.push({ type: "POISON_FADED" });
    character.logger.info(`The poison naturally ran its course on ${character.name}.`);
  }
};

export default class EffectsManager {
  private static registry: Map<string, Effect> = new Map([
    [EffectType.POISON, poisonEffect]
  ]);

  public static tick(character: Character, _tick: number, _world: World): void {
    const expiredEffects: string[] = [];

    for (const [effectName, activeEffect] of character.activeEffects) {
      const script = this.registry.get(effectName);

      if (!script) {
        character.logger.error(`Unknown effect script: ${effectName}`);
        activeEffect.duration = 0;
        continue;
      }

      script.onTick({ character, activeEffect });

      if (activeEffect.duration > 0) {
        activeEffect.duration--;
      }

      if (activeEffect.duration <= 0) {
        expiredEffects.push(effectName);
        if (script.onRemove) script.onRemove({ character });
      }
    }

    for (const effectName of expiredEffects) {
      character.activeEffects.delete(effectName);
    }
  }

  public static apply(character: Character, effect: ActiveEffect): void {
    const clampedDensity = Math.max(1, Math.min(10, effect.density));

    effect.interval = clampedDensity === 10
        ? 1
        : Math.round(Math.pow(11 - clampedDensity, 1.0 + Math.random()) * 6);

    character.activeEffects.set(effect.type, effect);

    character.logger.info(`Applied ${effect.type} to ${character.name} for ${effect.duration} ticks.`);
  }
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
  onApply?: (ctx: ActiveEffectContext) => void;
  onTick: (ctx: ActiveEffectContext) => void;
  onRemove?: (ctx: ActiveEffectContext) => void;
}