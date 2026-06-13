import path from 'path';
import fs from 'fs/promises'
import type { ICommandHandler, CommandContext } from "~/types/game";
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

    if (player.character) {
      player.send({ type: "JOIN_FAIL", data: "Character is already loaded." });
      return;
    }

    try {
      // Resolve the direct system path to your character file (e.g., data/characters/456.json)
      const filePath = path.resolve(process.cwd(), `data/characters/${cid}.json`);

      // Read the file string raw from disk
      const fileContent = await fs.readFile(filePath, 'utf-8');

      // Parse it into a fresh, isolated JavaScript object
      const characterRecord = JSON.parse(fileContent);

      // Instantiate with the clean file structure
      const character = new Character(characterRecord);
      player.character = character;

      game.world.join(character);
      player.send({ type: "JOIN_SUCCESS", data: true });
      this.logger.info(`${character.name} loaded from ${cid}.json and entered the world!`);

    } catch (error: any) {
      player.send({
        type: "JOIN_FAIL",
        data: error
      });
    }
  }
}