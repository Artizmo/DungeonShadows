import type { Effect } from '~/@types/effects';
import { GameEventType } from '~/@types/events';
import Log from '~/core/Logger';

export const poisonEffect: Effect = {
  name: "POISON",

  tick({ activeEffect, character }) {
    if (character.isDead) return;

    console.log('poison tick')
    if (activeEffect.duration % activeEffect.interval === 0) {
      character.damage(5);
      Log.CHAR.INFO(`${character.name} takes 5 poison damage.`);
    }
  },

  apply({ activeEffect, character }) {
    Log.CHAR.INFO(`Applied ${activeEffect.type} to ${character.name} for ${activeEffect.duration} ticks.`);
  },

  remove({ character }) {
    Log.CHAR.INFO(`The poison naturally ran its course on ${character.name}.`);
  }
};