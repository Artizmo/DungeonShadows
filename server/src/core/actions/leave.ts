import { fetchPlayer } from "~/_utils/functions/fetchCharacter";
import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const Leave: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const character = game.world.characters.get(data.characterId);
    if (!character) return;

    game.world.remove(character.id);

    const player = await fetchPlayer(character.playerId);
    Log.NETWORK.INFO(`${player.fullName} has disconnected!`);
  },
};
