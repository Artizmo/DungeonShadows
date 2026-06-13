import type { GameEvent } from '~/@types/events';

export const drinkEvent: GameEvent = {
  name: "DRINK",

  tick({ character }) {
    if (character.isDead) return;
    character.logger.info(`${character.name} drinks.`);
  }
};