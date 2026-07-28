import { fetchPlayer } from "~/utils/functions/fetchCharacter";
import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/handlers/types";

export const Disconnect: ActionHandler = {
  handle: async ({ data, game }): Promise<void> => {
    const { characterId } = data;

    game.world.disconnect(characterId);
  },
};
