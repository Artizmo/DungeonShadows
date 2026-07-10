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
      const character = new Character(characterData);
      character.playerId = player.id;
      game.world.add(character);

      const packet = Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.JOIN,
        character,
      });
      game.network.broadcast.sendTo(character.id, packet);

      // 🟢 Send MAP_CHUNK data from cache
      const mapChunks = await game.world.mapCache.getZoneMapChunks(
        character.zone,
      );

      for (const chunk of mapChunks) {
        const packet = Serialize.data({
          serverTick: game.loop.tick,
          actionType: ActionType.LOAD_MAP,
          characterId: character.id,
          chunk,
        });
        game.network.broadcast.sendTo(character.id, packet);
      }
    } catch (error) {
      Log.DATA.ERROR(`Could not load server data: ${error}`);
    }
  },
};
