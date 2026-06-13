import type { ICommandHandler, CommandContext } from "~/types/game";
import Log from "~/core/Logger";

export default class DrinkCommand implements ICommandHandler {
  public execute({ player, args, data }: CommandContext): void {
    const { character } = player;
    if (!character) return;

    try {
    const targetContainer = (args && args[0]) || data.containerId;

    if (!targetContainer) {
      throw "You tried to drink but specified no container.";
    }

    player.send({ type: "DRINK_SUCCESS", data: true });
    Log.SYSTEM.INFO(`${character.name} is drinking from ${targetContainer}...`);

    } catch (error: any) {
      player.send({
        type: "DRINK_FAILURE",
        data: error
      });
    }
  }
}