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
    if (game.world.characters.has(characterId)) return;

    const [player, character] = await Promise.all([fetchPlayer(playerId), fetchCharacter(characterId)]);
    Log.NETWORK.INFO(`${player.fullName} has connected!`);

    character.playerId = player.id;
    character.cameraWidth = data.camera.width;
    character.cameraHeight = data.camera.height;
    const { chunks, zone } = await game.world.handleCharacterSpatialUpdate(character);

    game.world.add(character);

    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.JOIN,
        character,
        chunks,
        zone: {
          ...zone,
          userCount: zone.buckets.get(character.currentBucketKey).userCount,
        },
      }),
    );
  },
};
