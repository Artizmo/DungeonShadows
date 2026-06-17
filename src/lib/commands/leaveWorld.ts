import type { ICommandHandler, CommandContext } from "~/types/game";
import Log from "~/core/Logger";

export default class LeaveWorldCommand implements ICommandHandler {
  public async execute({ player, game }: CommandContext): Promise<void> {
    const { character } = player;

    if (!character) {
      player.send({
        type: "LEAVE_FAILURE",
        data: "You have no character in the world.",
      });
      return;
    }

    try {
      game.world.charactersWithEvents.delete(character.id);
      game.world.leave(character);
      player.character = null;
      player.send({ type: "LEAVE_SUCCESS", data: true });
      Log.WORLD.INFO(`${character.name} has left the world!`);
    } catch (e) {
      Log.WORLD.ERROR(`${character.name} failed to enter the world: ${e}.`);
    }
  }
}
