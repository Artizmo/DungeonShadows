import type { ActionHandler } from "~/core/handlers/types";
import { CommandType } from "../utils/input-dictionary";

export const Move: ActionHandler = {
  execute: ({ data, game }): void => {
    if (!game?.world) return;
    if (!game.world.character) return;

    const { character } = game.world;
    const { activeCommands, deltaTime } = data;
    let dx = 0;
    let dy = 0;

    // 🟢 Grab direction vectors
    if (activeCommands.has(CommandType.MOVE_UP)) dy -= 1;
    if (activeCommands.has(CommandType.MOVE_DOWN)) dy += 1;
    if (activeCommands.has(CommandType.MOVE_LEFT)) dx -= 1;
    if (activeCommands.has(CommandType.MOVE_RIGHT)) dx += 1;

    // 🟢 Normalizing all movement directions as 1 unit of movement
    // ie. moving diagonally would be at the same rate as moving along the x and y axes
    // [Link to Ref 1001](References.md#ref-1001)
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    // 🟢 Grab the velocity vector (direction * time slice * speed)
    const velocity = {
      x: dx * deltaTime * character.speed,
      y: dy * deltaTime * character.speed,
    };

    // 🟢 Update local state
    character.move(velocity);

    // Limit movement to the bounds of the curernt zone map
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
  },
};
