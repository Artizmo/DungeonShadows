import type { ICommandHandler, CommandContext } from "~/types/game";
import { charactersData } from '~/data/mock/mock';
import Logger from '~/core/Logger';
import Character from "~/core/Character";

export default class JoinWorldCommand implements ICommandHandler {
  logger = new Logger("WORLD");
  public async execute({ player, game, data }: CommandContext): Promise<void> {
    const { cid } = data;

    if (!cid) {
      player.send({ type: "JOIN_FAIL", data: { message: "Invalid character." } });
      return;
    }

    const character = new Character(charactersData.get(cid));
    player.character = character;

    try {
      game.world.join(character);
      player.send({ type: "JOIN_SUCCESS", data: true });
      this.logger.info(`${character.name} has entered the world!`);
    } catch (e) {
      this.logger.error(`${character.name} failed to enter the world: ${e}.`);
    }
  }
}