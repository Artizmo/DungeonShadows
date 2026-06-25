import type { ICommandHandler, CommandContext } from "~/core/game/@types";
import EffectsManager from "~/core/game/EffectsManager";
import { poison } from "../effects/poison";

export default class SleepCommand implements ICommandHandler {
  execute({ player }: CommandContext): void {
    const { character } = player;

    if (!character) {
      player.send({ type: "SLEEP_FAIL", data: "You're not in the world!" });
      return;
    }

    if (character.isDead) {
      player.send({
        type: "SLEEP_FAIL",
        data: "You cannot sleep when you're dead!",
      });
      return;
    }

    player.send({
      type: "SLEEP_SUCCESS",
      data: "You close your eyes and begin to rest...",
    });

    EffectsManager.addEffect(poison, character);
  }
}
