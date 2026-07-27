import type { ActionHandler } from "~/core/handlers/types";

export const UpdateZone: ActionHandler = {
  execute: ({ data, character, game }): void => {
    if (character && data.character) {
      character.currentBucketId = data.character.currentBucketId;
    }

    game!.renderer.loadMap(data.chunks, data.unchunks);
    game!.events.emit("game_update");
  },
};
