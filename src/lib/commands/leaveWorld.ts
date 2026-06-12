import type { ICommandHandler, CommandContext } from "~/types/game";

export default class LeaveWorldCommand implements ICommandHandler {
  public async execute({ player, game }: CommandContext): Promise<void> {
    const { character } = player;

    if (!character) {
      player.send({ type: "LEAVE_FAILURE", data: "You have no character in the world." });
      return;
    }

    try {
      game.world.activeTickers.delete(character.id);
      game.world.leave(character);
      player.character = null;
      player.send({ type: "LEAVE_SUCCESS", data: true });
      game.world.logger.info(`${character.name} has left the world!`);
    } catch (e) {
      game.world.logger.error(`${character.name} failed to enter the world: ${e}.`);
    }
  }
}