import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const Join: ActionHandler = {
  execute: ({ data, game }): void => {
    try {
      const { character } = data;
      game.world.add(character);
      game.events.emit("game_update");
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
