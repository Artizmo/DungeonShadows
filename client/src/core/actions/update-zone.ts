import type { ActionHandler } from "~/core/actions/types";

export const UpdateZone: ActionHandler = {
  execute: ({ data, character, game }): void => {
    if (character && data.character) {
      character.currentBucketKey = data.character.currentBucketKey;
    }

    game!.renderer.loadMap(data.chunks, data.unchunks);
    game!.events.emit("game_update");
  },
};
