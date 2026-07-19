import { fetchPlayer } from "~/_utils/functions/fetchCharacter";
import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const Leave: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const character = game.world.characters.get(data.characterId);
    const player = await fetchPlayer(character.playerId);

    game.world.remove(character.id);
    game.world.areas
      .get(character.zone.areaId)
      .zones.get(character.zone.id)
      .buckets.get(character.currentBucketKey)
      .entities.clear();
    game.world.areas
      .get(character.zone.areaId)
      .zones.get(character.zone.id)
      .buckets.get(character.currentBucketKey).userCount--;

    Log.NETWORK.INFO(`${player.fullName} has disconnected!`);
  },
};
