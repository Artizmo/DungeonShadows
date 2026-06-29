import type Character from "~/core/character/Character";
import type { Effect } from "~/_lib/effects/types";
import { Log } from "~/shared/core/Logger";
// import { send } from "~/_utils/messageBroker";

export default class EffectsManager {
  public static tick(character: Character, _tick: number): void {
    const expiredEffects: Effect[] = [];

    for (const effect of character.effects.values()) {
      if (!effect) {
        Log.CHAR.ERROR(`Unknown effect script: ${effect.name}`);
        expiredEffects.push(effect);
        continue;
      }

      if (effect.duration > 0) {
        effect.duration--;
      }

      effect.tick({ character, effect });

      if (effect.duration <= 0) {
        expiredEffects.push(effect);
      }
    }

    for (const effect of expiredEffects) {
      EffectsManager.removeEffect(effect, character);
    }
  }

  public static addEffect(effect: Effect, character: Character): void {
    if (!effect) {
      Log.CHAR.ERROR(`Unknown effect script: ${effect.type}`);
      return;
    }

    const effectInstance = { ...effect };

    // character.addEffect(effectInstance);
    // send(character.player.id, {
    //   type: "ADD_EFFECT",
    //   data: effectInstance.applyMessage,
    // });
  }

  public static removeEffect(activeEffect: Effect, character: Character): void {
    if (!activeEffect) {
      Log.CHAR.ERROR(`Unknown effect script: ${activeEffect.type}`);
      return;
    }

    // character.removeEffect(activeEffect);
    // send(character.player.id, {
    //   type: "REMOVE_EFFECT",
    //   data: activeEffect.resolveMessage,
    // });
  }
}
