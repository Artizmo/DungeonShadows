import path from 'path';
import fs from 'fs/promises';
import type { ICommandHandler, CommandContext } from "~/types/game";
import { send } from "~/utils/messageBroker";
import Log from '~/core/Logger';
import Character from "~/core/Character";

export default class JoinWorldCommand implements ICommandHandler {
  public async execute({ player, game, data }: CommandContext): Promise<void> {
    const { cid } = data;
    let character: Character;

    try {
      if (!cid) {
        throw "Invalid character identifier.";
      }

      if (game.world.characters.has((cid))) {
        character = game.world.characters.get(cid);
        throw "Character is already in the world!";
      }

      const filePath = path.resolve(process.cwd(), `data/characters/${cid}.json`);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const characterRecord = JSON.parse(fileContent);
      character = new Character(characterRecord);
      character.playerId = player.id;
      player.character = character;

      game.world.join(character);

      player.send({ type: "JOIN_SUCCESS", data: true });
      Log.WORLD.INFO(`${character.name} loaded from ${cid}.json.`);
      Log.WORLD.INFO(`${character.name} has entered the world!`);

    } catch (error) {
      player.send({
        type: "JOIN_FAIL",
        data: error
      });
      Log.SYSTEM.ERROR(`Attempt to enter world as ${character.name}`);
    }
  }
}