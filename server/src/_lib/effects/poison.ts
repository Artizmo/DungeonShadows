import { Effect, EffectType } from "~/_lib/effects/types";
import { Log } from "~/shared/core/Logger";
import { send } from "~/_utils/messageBroker";

export const poison: Effect = {
  name: "Poison",
  type: EffectType.POISON,
  duration: 100,
  density: 3,
  interval: 20,
  applyMessage: "You feel a burning toxic liquid enter your veins!",
  resolveMessage:
    "The dark poison naturally runs its course and leaves your body.",

  tick({ character, effect }) {
    const clampedDensity = Math.max(1, Math.min(10, effect.density));
    effect.interval =
      clampedDensity === 10
        ? 1
        : Math.round(Math.pow(11 - clampedDensity, 1.0 + Math.random()) * 6);

    if ((effect.duration + 3) % effect.interval === 0) {
      Log.CHAR.INFO(`${character.name} takes 5 poison damage.`);

      send(character.player.id, {
        type: "POISON_AFFECT",
        data: "Poison is coursing through your veins!",
      });
    }
  },
};
