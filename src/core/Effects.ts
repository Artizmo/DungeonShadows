import type Character from './Character';

export default class Effect {
  public static process(character: Character): void {
    const effects = character.activeEffects;

    for (const [name, effect] of effects) {
      if (name === "poison") {
        this.processPoison(character, effect);
      }
      // You can add more effect types here easily
    }
  }

  private static processPoison(character: Character, effect: any): void {
    if (character.isDead) {
      character.activeEffects.delete("poison");
      character.logger.info(`${character.name} is dead!`);
      return;
    };

    if (effect.duration % effect.interval === 0) {
      character.damage(5);
      character.logger.info(`${character.name} takes 5 poison damage. Current HP: ${character.stats.hp} (Ticks Remaining: ${effect.duration})`);
    }

    // Logic: Decay
    effect.duration--;

    console.log('effect.duration', effect.duration)

    // Logic: Cleanup
    if (effect.duration <= 0) {
      character.activeEffects.delete("poison");
      character.pendingEvents.push({ type: "POISON_FADED" });
      character.logger.info(`The poison naturally ran its course and faded from ${character.name}.`);
    }
  }
}