import { fetchCharacter } from "~/_utils/functions/fetchCharacter";
import type { ActionHandler } from "~/core/handlers/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";

export const Connect: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const { characterId, camera } = data;
    const character = await fetchCharacter(characterId, camera);
    if (!character) return;

    game.world.connectCharacter(character);

    const { chunks, zone } =
      await game.world.updateCharacterSpatialZone(character);
    const initialEntities = game.world.getAOIState(character);

    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        serverTick: game.loop.tick,
        actionType: ActionType.CONNECT,
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
