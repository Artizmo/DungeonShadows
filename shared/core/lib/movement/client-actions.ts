import {
  CommandType,
  type IClientCharacter,
  type IClientGame,
} from "~/shared/core/types.js";

interface ActionClientHandler {
  handle(actionHandlerContext: ActionHandlerClientContext): void;
}

interface ActionHandlerClientContext {
  data: any;
  character?: IClientCharacter;
  game?: IClientGame;
}

export const Move: ActionClientHandler = {
  handle: ({ data, game }: ActionHandlerClientContext): void => {
    if (!game?.world) return;
    if (!game.world.character) return;

    const { character } = game.world;
    const { activeCommands, tickRate } = data;
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
      x: dx * tickRate * character.speed,
      y: dy * tickRate * character.speed,
    };

    // 🟢 Update local state
    character.move(velocity);

    // Limit movement to the bounds of the curernt zone map
    console.log("bingo", game.world);
    const zone = game.world.zoneManager.getZone(character.zoneId);
    if (zone?.map) {
      const minBoundX = 0;
      const minBoundY = 0;
      const maxBoundX = zone.map.width;
      const maxBoundY = zone.map.height;

      if (character.transform.position.x < minBoundX)
        character.transform.position.x = minBoundX;
      if (character.transform.position.x > maxBoundX)
        character.transform.position.x = maxBoundX;
      if (character.transform.position.y < minBoundY)
        character.transform.position.y = minBoundY;
      if (character.transform.position.y > maxBoundY)
        character.transform.position.y = maxBoundY;
    }
  },
};
