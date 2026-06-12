import type Character from "~/core/Character";

export type HealType = "natural" | "potion" | "spell" | "lifesteal";

export class HealingSystem {
  public static heal(target: Character, amount: number, type: HealType): void {
    const { hp, maxHp } = target.stats;

    console.log('bingo heal', hp, maxHp, amount, type)
    // if (hp <= 0) {
    //   return;
    // }

    // if (hp >= maxHp) {
    //   return;
    // }

    // const startingHp = hp;

    // target.stats.hp = Math.min(maxHp, hp + amount);

    // if (hp > startingHp) {
    //   const actualHealedAmount = hp - startingHp;

    //   target.pendingEvents.push({
    //     type: "HEAL",
    //     source: source,
    //     amount: actualHealedAmount
    //   });
    // }
  }
}