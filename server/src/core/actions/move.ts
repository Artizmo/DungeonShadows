import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";
import { CommandType } from "~/core/actions/types";
import { Serialize } from "~/shared/network/serialize";
import { ActionType } from "~/shared/core/types";

export interface Coords {
  x: number;
  y: number;
}

export const Move: ActionHandler = {
  execute: async ({ data, character, game }): Promise<void> => {
    if (!game || !character) return;

    try {
      // 1. Get the processed velocity vector for this step
      const velocity = Move.applyPhysics!({ data });
      character.move(velocity);
      const { toLoadChunks } =
        await game.world.handleCharacterSpatialUpdate(character);
      game.network.broadcast.sendTo(
        character.id,
        Serialize.data({
          serverTick: game.loop.tick,
          actionType: ActionType.LOAD_MAP,
          characterId: character.id,
          chunks: toLoadChunks,
        }),
      );
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
      return;
    }
  },

  applyPhysics: ({ data }): Coords => {
    try {
      const { activeCommands, deltaTime, speed } = data;
      let dx = 0;
      let dy = 0;

      // Extract intentions
      if (activeCommands.has(CommandType.MOVE_UP)) dy -= 1;
      if (activeCommands.has(CommandType.MOVE_DOWN)) dy += 1;
      if (activeCommands.has(CommandType.MOVE_LEFT)) dx -= 1;
      if (activeCommands.has(CommandType.MOVE_RIGHT)) dx += 1;

      // 🟢 SAFE CODES: Calculate true vector length
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 0) {
        // 🟢 Force a pure directional unit vector regardless of raw hardware magnitude
        dx /= length;
        dy /= length;
      }

      // 🟢 The Golden Formula: Direction * Time Slice * Real Speed Value
      // If speed = 300 and deltaTime = 1/60, this returns exactly 5 pixels per tick.
      return {
        x: dx * deltaTime * speed,
        y: dy * deltaTime * speed,
      };
    } catch (error) {
      Log.DATA.ERROR(`Could not run physics for move action: ${error}.`);
      return { x: 0, y: 0 };
    }
  },
};
