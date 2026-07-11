import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const LoadMap: ActionHandler = {
  execute: ({ data, game }): void => {
    try {
      const { chunk } = data;
      if (!chunk) return;

      game!.renderer.loadMap(chunk);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
