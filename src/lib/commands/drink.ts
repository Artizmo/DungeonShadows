import type { ICommandHandler, CommandContext } from "~/types/game";
import Log from '~/core/Logger';

export default class DrinkCommand implements ICommandHandler {
  public async execute({ player, game }: CommandContext): Promise<void> {
    const { character } = player;

    try {
      await game.world.save(character);

      player.send({ type: "SAVE", data: true });
      Log.WORLD.INFO(`${character.name} saved successfully!`);
    } catch (error) {
      player.send({ type: "ERROR", data: error });
    }
  }
}