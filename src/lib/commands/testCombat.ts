import type { ICommandHandler, CommandContext } from "~/types/game";
import { EffectType } from '~/@types/effects';

export default class TestCombatCommand implements ICommandHandler {
  public execute({ player, game }: CommandContext): void {
    const character = player.character;
    if (!character) {
      player.send({ type: "ERROR", data: "You must be in the world to test combat." });
      return;
    }

    character.applyEffect({ type: EffectType.POISON, duration: 200, density: 3 });

    player.send({ type: "FIGHT", data: `${character.name} was struck by a test toxic dart!` });
  }
}