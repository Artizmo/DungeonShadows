import type { Effect } from '~/@types/effects';

export const poisonEffect: Effect = {
  name: "POISON",

  tick({ activeEffect, character }) {
    if (character.isDead) return;

    if (activeEffect.duration % activeEffect.interval === 0) {
      character.damage(5);
      character.logger.info(`${character.name} takes 5 poison damage. Current HP: ${character.stats.hp} (Ticks Remaining: ${activeEffect.duration})`);
    }
  },

  apply({ activeEffect, character }) {
    character.logger.info(`Applied ${activeEffect.type} to ${character.name} for ${activeEffect.duration} ticks.`);
  },

  remove({ character }) {
    character.logger.info(`The poison naturally ran its course on ${character.name}.`);
  }
};