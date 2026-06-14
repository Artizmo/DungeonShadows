import { Effect, EffectType } from '~/lib/effects/types';
import Log from '~/core/Logger';
import { send } from '~/utils/messageBroker';

export const poison: Effect = {
  name: "Poison",
  type: EffectType.POISON,
  duration: 100,
  density: 9,
  interval: 20,
  applyMessage: "You feel a burning toxic liquid enter your veins!",
  resolveMessage: "The dark poison naturally runs its course and leaves your body.",

  tick({ character, effect }) {
    if (character.isDead) return;

    const clampedDensity = Math.max(1, Math.min(10, effect.density));
    effect.interval = clampedDensity === 10
      ? 1
      : Math.round(Math.pow(11 - clampedDensity, 1.0 + Math.random()) * 6);

    if ((effect.duration + 3) % effect.interval === 0) {
      character.damage(5);
      Log.CHAR.INFO(`${character.name} takes 5 poison damage.`);

      send(character.playerId, {
        type: "POISON_AFFECT",
        data: "Poison is coursing through your veins!"
      });
    }
  }
};