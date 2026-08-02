import { fetchCharacter } from "~/utils/fetchCharacter";
import type { ActionHandler } from "~/core/handlers/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";
// import { FLAG_DIRTY, FLAG_POSITION } from "~/shared/core/constants";

export const Connect: ActionHandler = {
  handle: async ({}): Promise<void> => {
    // const { characterId, playerId, camera } = data;
    // const character = await fetchCharacter(characterId, playerId, camera);
    // if (!character) return;
    // // 1. Register character in world FIRST so they exist in spatial lookups
    // game.world.connect(character);
    // // 2. Trigger spatial update (gets RAM hits synchronously & queues disk reads for misses)
    // const { chunks, zone } = game.world.updateCharacterSpatialZone(character);
    // // Build an O(1) set of existing chunk keys
    // const loadedKeys = new Set(chunks.map((c) => `${c.x}_${c.y}`));
    // // Fetch missing chunks in parallel
    // const fetchedChunks = await Promise.all(
    //   Array.from(character.AOIBucketKeys)
    //     .filter((key) => !loadedKeys.has(key))
    //     .map((key) => game.world.mapCache.fetchAndCacheChunk(zone, key))
    // );
    // // Combine RAM chunks with newly loaded chunks (filtering out null/undefined)
    // const allInitialChunks = [
    //   ...chunks,
    //   ...fetchedChunks.filter((c): c is NonNullable<typeof c> => Boolean(c)),
    // ];
    // // 3. Send heavy STATIC MAP DATA directly to the connecting client (One-Off RPC)
    // // Terrain tiles and static chunk structures do not change every tick, so we ship them once here.
    // game.network.broadcast.sendTo(
    //   character.id,
    //   Serialize.data({
    //     serverTick: game.loop.tick,
    //     actionType: ActionType.CONNECT,
    //     chunks: allInitialChunks,
    //     zone: {
    //       ...zone,
    //       buckets: Array.from(zone.buckets),
    //     },
    //   })
    // );
  },
};
