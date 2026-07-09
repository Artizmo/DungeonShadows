import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const LoadMap: ActionHandler = {
  execute: ({ chunk }, game): void => {
    try {
      if (!chunk) return;

      game.renderer.loadMap(chunk);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
