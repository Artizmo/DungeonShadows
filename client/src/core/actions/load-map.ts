import type { ActionHandler } from "~/core/actions/types";
import Zone from "../Zone";

export const LoadMap: ActionHandler = {
  execute: ({ data, character, game }): void => {
    const { chunks, toUnloadKeys } = data;
    if (character && data.character) {
      character.currentBucketKey = data.character.currentBucketKey;
    }
    game!.renderer.loadMap(chunks, toUnloadKeys);
    game!.events.emit("game_update");
  },
};
