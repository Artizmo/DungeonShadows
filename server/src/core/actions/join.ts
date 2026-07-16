import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import Player from "~/core/Player";
import { Log } from "~/shared/core/Logger";
import Character from "../Character";
import type { ActionHandler } from "~/core/actions/types";
import { Serialize } from "~/shared/network/serialize";
import { ActionType } from "~/shared/core/types";

export const Join: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    try {
      const { playerId, characterId } = data;
      const [playerData, characterData] = await Promise.all([
        fetchPlayer(playerId),
        fetchCharacter(characterId),
      ]);
      const player = new Player(playerData);
      Log.NETWORK.INFO(`${player.fullName} has connected!`);

      characterData.camera = data.camera;
      const character = new Character(characterData);

      // todo: pass camera data from client
      character.playerId = player.id;
      game.world.add(character);

      game.network.broadcast.sendTo(
        character.id,
        Serialize.data({
          serverTick: game.loop.tick,
          actionType: ActionType.JOIN,
          character,
        }),
      );

      const { toLoadChunks, toUnloadKeys } =
        await game.world.handleCharacterSpatialUpdate(character);

      game.network.broadcast.sendTo(
        character.id,
        Serialize.data({
          serverTick: game.loop.tick,
          actionType: ActionType.LOAD_MAP,
          characterId: character.id,
          chunks: toLoadChunks,
        }),
      );
    } catch (error) {
      Log.DATA.ERROR(`Could not load server data: ${error}`);
    }
  },
};
