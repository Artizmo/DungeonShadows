import type { ICommandHandler, CommandContext } from "~/types/game";

export default class LeaveWorldCommand implements ICommandHandler {
  public async execute({ player, game }: CommandContext): Promise<void> {
    const { character } = player;

    try {
      game.world.leave(character);
      player.send({ type: "LEAVE_SUCCESS", data: true });
      game.world.logger.info(`${character.name} has left the world!`);
    } catch (e) {
      game.world.logger.error(`${character.name} failed to enter the world: ${e}.`);
    }
  }
}