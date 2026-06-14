import type World from "~/core/World";
import type Character from "~/core/Character";
import type { Effect } from '~/lib/effects/types';
import Log from './Logger';
import { send } from '~/utils/messageBroker';

export default class EffectsManager {
  public static tick(character: Character, _tick: number, _world: World): void {
    const expiredEffects: Effect[] = [];

    if (character.isDead) {
      character.effects.clear();
      return;
    }

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
      EffectsManager.removeEffect(effect, character)
    }
  }

  public static addEffect(effect: Effect, character: Character): void {
    if (!effect) {
      Log.CHAR.ERROR(`Unknown effect script: ${effect.type}`);
      return;
    }

    const effectInstance = { ...effect };

    character.addEffect(effectInstance);
    send(character.playerId, {
      type: "ADD_EFFECT",
      data: effectInstance.applyMessage
    });
  }

  public static removeEffect(activeEffect: Effect, character: Character): void {
    if (!activeEffect) {
      Log.CHAR.ERROR(`Unknown effect script: ${activeEffect.type}`);
      return;
    }

    character.removeEffect(activeEffect);
    send(character.playerId, {
      type: "REMOVE_EFFECT",
      data: activeEffect.resolveMessage
    });
  }
}