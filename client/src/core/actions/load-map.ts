import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const LoadMap: ActionHandler = {
  execute: ({ data, game }): void => {
    try {
      const { chunks } = data;
      if (!chunks) return;

      game!.renderer.loadMap(chunks);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
