import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const LoadMap: ActionHandler = {
  execute: ({ data, game }): void => {
    try {
      const { chunks, toUnloadKeys } = data;

      game!.renderer.loadMap(chunks, toUnloadKeys);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
