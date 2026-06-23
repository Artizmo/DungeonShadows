import { Effect, EffectType } from "~/lib/effects/types";
import Log from "~/shared/core/Logger";
import { send } from "~/utils/messageBroker";

export const burn: Effect = {
  name: "Burn",
  type: EffectType.BURN,
  duration: 400,
  density: 3,
  interval: 10,
  applyMessage: "A rash develops on your skin!",
  resolveMessage: "The rash on your body clears up.",

  tick({ character, effect }) {
    if (character.isDead) return;

    const clampedDensity = Math.max(1, Math.min(10, effect.density));
    effect.interval =
      clampedDensity === 10
        ? 1
        : Math.round(Math.pow(11 - clampedDensity, 1.0 + Math.random()) * 6);

    if ((effect.duration + 3) % effect.interval === 0) {
      character.damage(2);
      Log.CHAR.INFO(`${character.name} takes 2 burn damage.`);

      send(character.playerId, {
        type: "BURN_AFFECT",
        data: "Your skin rash burns! Ouch!",
      });
    }
  },
};
