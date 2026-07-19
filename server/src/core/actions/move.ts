import { Log } from "~/shared/core/Logger";
import type { ActionHandler } from "~/core/actions/types";
import { CommandType } from "~/core/actions/types";
import { Serialize } from "~/shared/core/serialize";
import { ActionType } from "~/shared/core/types";

export interface Coords {
  x: number;
  y: number;
}

export const Move: ActionHandler = {
  execute: async ({ data, character, game }): Promise<void> => {
    if (!game || !character) return;

    // const velocity = Move.applyPhysics!({ data });
    const { lastProcessedSequenceId, speed } = character;
    const { activeCommands, deltaTime } = data;
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
    const velocity = {
      x: dx * deltaTime * speed,
      y: dy * deltaTime * speed,
    };

    character.move(velocity);

    const { chunks, unchunks, zone } =
      await game.world.handleCharacterSpatialUpdate(character);

    game.network.broadcast.sendTo(
      character.id,
      Serialize.data({
        lastProcessedSequenceId,
        serverTick: game.loop.tick,
        actionType: ActionType.ZONE_UPDATE,
        character,
        chunks,
        unchunks,
        zone: {
          ...zone,
          userCount: zone.buckets.get(character.currentBucketKey).userCount,
        },
      }),
    );
  },
};
