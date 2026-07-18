import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import Player from "~/core/Player";
import { Log } from "~/shared/core/Logger";
import Character from "../Character";
import type { ActionHandler } from "~/core/actions/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";

export const Join: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const { playerId, characterId } = data;
    const [playerData, characterData] = await Promise.all([
      fetchPlayer(playerId),
      fetchCharacter(characterId),
    ]);
    const player = new Player(playerData);
    Log.NETWORK.INFO(`${player.fullName} has connected!`);

    characterData.cameraWidth = data.camera.width;
    characterData.cameraHeight = data.camera.height;
    const character = new Character(characterData);
    const { toLoadChunks, zone } =
      await game.world.handleCharacterSpatialUpdate(character);

    character.playerId = player.id;
    game.world.add(character);

    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.JOIN,
        character,
        chunks: toLoadChunks,
        zone: { ...zone, buckets: Array.from(zone.buckets) },
      }),
    );

    // game.network.broadcast.sendTo(
    //   character.id,
    //   Serialize.data({
    //     serverTick: game.loop.tick,
    //     actionType: ActionType.LOAD_MAP,
    //     character,
    //     chunks: toLoadChunks,
    //   }),
    // );
  },
};
