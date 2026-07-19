import type { ActionHandler } from "~/core/actions/types";
import { CommandType } from "./input-dictionary";

export interface Coords {
  x: number;
  y: number;
}

export const Move: ActionHandler = {
  execute: ({ data, character, game }): Coords => {
    if (!game || !character) return { x: 0, y: 0 };

    // 1. Get the processed velocity vector for this step
    const { activeCommands, deltaTime, speed } = data;
    let dx = 0;
    let dy = 0;

    // Extract intentions
    if (activeCommands.has(CommandType.MOVE_UP)) dy -= 1;
    if (activeCommands.has(CommandType.MOVE_DOWN)) dy += 1;
    if (activeCommands.has(CommandType.MOVE_LEFT)) dx -= 1;
    if (activeCommands.has(CommandType.MOVE_RIGHT)) dx += 1;

    // Calculate true vector length
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    // The Golden Formula: Direction * Time Slice * Real Speed Value
    const velocity = {
      x: dx * deltaTime * speed,
      y: dy * deltaTime * speed,
    };

    character.move(velocity);

    // 🟢 FIX: Enforce identical boundary constraints locally during prediction/replay loops
    if (character.zone && character.zone.map) {
      const minBoundX = 0;
      const minBoundY = 0;
      const maxBoundX = character.zone.map.width;
      const maxBoundY = character.zone.map.height;

      if (character.position.x < minBoundX) character.position.x = minBoundX;
      if (character.position.x > maxBoundX) character.position.x = maxBoundX;
      if (character.position.y < minBoundY) character.position.y = minBoundY;
      if (character.position.y > maxBoundY) character.position.y = maxBoundY;
    }

    return velocity;
  },
};
