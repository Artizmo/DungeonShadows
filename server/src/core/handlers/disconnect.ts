import { fetchPlayer } from "~/_utils/functions/fetchCharacter";
import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/handlers/types";

export const Disconnect: ActionHandler = {
  execute: async ({ data, game }): Promise<void> => {
    const character = game.world.characters.get(data.characterId);
    if (!character) return;

    game.world.removeCharacter(character.id);
    const player = await fetchPlayer(character.playerId);
    Log.NETWORK.INFO(`${player.fullName} has disconnected!`);
  },
};
