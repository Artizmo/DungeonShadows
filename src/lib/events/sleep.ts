import type { GameEvent } from '~/@types/events';
import { EffectType } from '~/@types/effects';

export const sleepEvent: GameEvent = {
  name: "SLEEP",

  tick({ character }) {
    if (character.isDead) return;

    const healAmount = 10;
    const previousHp = character.stats.hp;
    character.stats.hp = Math.min(character.stats.maxHp, character.stats.hp + healAmount);
    const actualHealed = character.stats.hp - previousHp;

    character.applyEffect({ type: EffectType.POISON, duration: 200, density: 3 });

    character.logger.info(
      `${character.name} slept and recovered ${actualHealed} HP. State: (${character.stats.hp}/${character.stats.maxHp} HP)`
    );
  }
};