import { fetchCharacter, fetchPlayer } from "~/_utils/functions/fetchCharacter";
import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";

export const Join: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const { playerId, characterId, camera } = data;
    if (game.world.characters.has(characterId)) return;

    const [player, character] = await Promise.all([
      fetchPlayer(playerId),
      fetchCharacter(characterId),
    ]);

    character.playerId = player.id;
    character.cameraWidth = camera.width;
    character.cameraHeight = camera.height;

    // 1. Add character to character map & spawn in spatial bucket
    game.world.addCharacter(character);
    game.world.spawn(character);

    // 2. Calculate the character's activeAOI buckets and fetch map chunks
    const { chunks, zone } =
      await game.world.updateCharacterSpatialZone(character);

    // 3. Gather full initial state for ALL entities currently inside their activeAOI
    const initialEntities = game.world.getAOIState(character);

    // 4. Send complete baseline packet to the client
    const currentBucket = zone.buckets.get(character.currentBucketId);

    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.JOIN,
        character,
        chunks,
        entities: [...initialEntities],
        zone: {
          ...zone,
          buckets: Array.from(zone.buckets),
        },
      })
    );
  },
};
