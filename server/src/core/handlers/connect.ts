import { fetchCharacter } from "~/utils/functions/fetchCharacter";
import type { ActionHandler } from "~/core/handlers/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";

export const Connect: ActionHandler = {
  handle: async ({ data, game }): Promise<void> => {
    const { characterId, playerId, camera } = data;
    const character = await fetchCharacter(characterId, playerId, camera);
    if (!character) return;

    // 1. Register character in world FIRST so they exist in spatial lookups
    await game.world.connect(character);

    // 2. Trigger spatial update (gets RAM hits synchronously & queues disk reads for misses)
    const { chunks: syncChunks, zone } =
      game.world.updateCharacterSpatialZone(character);

    // 3. Wait for any missing cold chunks to finish loading from disk for the INITIAL payload
    const missingKeys = Array.from(character.AOIBucketKeys).filter(
      (key) => !syncChunks.some((c) => `${c.x}_${c.y}` === key)
    );

    const asyncChunks = await Promise.all(
      missingKeys.map((key) =>
        game.world.mapCache.fetchAndCacheChunk(zone, key)
      )
    );

    // Combine synchronous RAM chunks with newly loaded disk chunks
    const allInitialChunks = [
      ...syncChunks,
      ...asyncChunks.filter((c): c is NonNullable<typeof c> => c !== undefined),
    ];

    // 4. Transmit full connection payload with guaranteed initial chunks!
    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.CONNECT,
        character,
        chunks: allInitialChunks, // 🟢 Now contains all initial AOI chunks!
        entities: [],
        zone: {
          ...zone,
          buckets: Array.from(zone.buckets),
        },
      })
    );
  },
};
