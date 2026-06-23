import type { ICommandHandler, CommandContext } from "~/types/game";
import Log from "~/core/Logger";

export class Drink implements ICommandHandler {
  public execute({ player, args, data }: CommandContext): void {
    try {
      const { character } = player;

      if (!character) {
        throw "You're not in the world!";
      }

      const targetContainer = (args && args[0]) || data.containerId;

      if (!targetContainer) {
        throw "You tried to drink but specified no container.";
      }

      player.send({ type: "DRINK_SUCCESS", data: true });
      Log.SYSTEM.INFO(
        `${character.name} is drinking from ${targetContainer}...`,
      );
    } catch (error: any) {
      player.send({
        type: "DRINK_FAILURE",
        data: error,
      });
    }
  }
}
