import type { GameEvent } from '~/@types/events';
import Log from '~/core/Logger';

export const drinkEvent: GameEvent = {
  name: "DRINK",

  tick({ character }) {
    if (character.isDead) return;

    Log.WORLD.INFO(`${character.name} drinks.`);
  }
};