import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";

export const Move: ActionHandler = {
  execute: ({ data, character, game }): void => {
    try {
      const { deltaTime } = data;
      // Speed in tiles per second
      const SPEED = 5;

      // CRITICAL: Ensure deltaTime is in SECONDS.
      // If your loop passes milliseconds (e.g., 16.66), you MUST divide by 1000.
      // If you multiply by 16.66, your character will teleport off the screen instantly.
      const dt = deltaTime > 1 ? deltaTime / 1000 : deltaTime;

      // Update the true floating-point position
      game.world.character.renderPosition.x += data.payload.x * dt * SPEED;
      game.world.character.renderPosition.y += data.payload.y * dt * SPEED;
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
