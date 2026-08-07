// import type { ActionHandler } from "~/core/handlers/types";
// import { CommandType } from "~/core/handlers/types";
// import type { Vector2D } from "~/lib/movement";

export const Move: ActionHandler = {
  handle: ({ data, character, game }): void => {
    // const { activeCommands, deltaTime } = data;
    // const directionVector: Vector2D = {
    //   x: 0,
    //   y: 0,
    // };
    // // 🟢 Get direction vector
    // if (activeCommands.has(CommandType.MOVE_UP)) directionVector.y -= 1;
    // if (activeCommands.has(CommandType.MOVE_DOWN)) directionVector.y += 1;
    // if (activeCommands.has(CommandType.MOVE_LEFT)) directionVector.x -= 1;
    // if (activeCommands.has(CommandType.MOVE_RIGHT)) directionVector.x += 1;
    // // 🟢 Update local state
    // game.world.moveCharacter(character.id, directionVector, deltaTime);
  },
};
