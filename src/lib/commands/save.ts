import type { ICommandHandler, CommandContext } from "~/types/game";

export default class SaveCommand implements ICommandHandler {
  public async execute({ player, game }: CommandContext): Promise<void> {
    const { character } = player;

    try {
      await game.world.save(character);

      player.send({ type: "SAVE", data: true });
      game.world.logger.info(`${character.name} saved successfully!`);
    } catch (error) {
      player.send({ type: "ERROR", data: error });
    }
  }
}