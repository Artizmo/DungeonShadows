import { GameEventType } from '~/@types/events';
import type { ICommandHandler, CommandContext } from "~/types/game";

/***
 * When to use a command:
 *
 * Anti-Cheat/Exploits: Is the player trying to sleep while running at full speed? Are they dead? Are they in combat?
 * Resource Costs: Does sleeping require spending 5 Energy or 10 Mana? (Deduct the cost here to prevent network spam).
 * Cooldowns: Did they just press the sleep button half a second ago?
 * Proximity/Context: Are they actually standing next to a bed?
 */
export default class SleepCommand implements ICommandHandler {
  execute({ player, game }: CommandContext): void {
    const { character } = player;

    if (!character) {
      player.send({ type: "SLEEP_FAIL", data: "You're not in the world!" });
      return;
    };

    if (character.isDead) {
      player.send({ type: "SLEEP_FAIL", data: "You cannot sleep when you're dead!" });
      return;
    }

    // character.applyEffect({ type: EffectType.POISON, duration: 200, density: 3 });

    character.applyEvent({ type: GameEventType.SLEEP })
    // game.world.queueCharacterWithEvents(character.id);

    player.send({
      type: "SLEEP_SUCCESS",
      data: "You close your eyes and begin to rest..."
    });
  }
}