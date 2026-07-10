import { Log } from "~/shared/core/Logger";
import Character from "~/core/Character";
import type { ActionHandler } from "~/core/actions/types";

export const Join: ActionHandler = {
  execute: ({ data, game }): void => {
    if (!game) return;

    try {
      const character = new Character(data.character);
      game.world.add(character);
      game.events.emit("game_update");
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
