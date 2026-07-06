import type Game from "~/core/Game";
import type { CommandResult } from "~/shared/core/types";
import { GameProtocol } from "~/shared/network/generated";

export const CommandRegistry = new Map<
  string,
  (
    isActive: (i: string) => boolean,
    consume: (i: string) => boolean,
    game: Game,
  ) => CommandResult | null
>();

CommandRegistry.set("COMMAND_MOVE", (isActive) => {
  let dx = 0,
    dy = 0;
  if (isActive("MOVE_UP")) dy -= 1;
  if (isActive("MOVE_DOWN")) dy += 1;
  if (isActive("MOVE_LEFT")) dx -= 1;
  if (isActive("MOVE_RIGHT")) dx += 1;
  if (dx !== 0 || dy !== 0)
    return {
      isLocal: false,
      type: GameProtocol.ActionType.MOVE,
      payload: { x: dx, y: dy },
    };
  return null;
});

CommandRegistry.set("COMMAND_CAST", (isActive, consumeJustPressed) => {
  if (consumeJustPressed("CAST_SPELL"))
    return {
      isLocal: false,
      type: GameProtocol.ActionType.CAST,
      payload: { targetId: "dummy" },
    };
  return null;
});

CommandRegistry.set("COMMAND_UI", (isActive, consumeJustPressed) => {
  if (consumeJustPressed("MENU_TOGGLE"))
    return { isLocal: true, execute: (g) => g.menuManager.toggleMenu() };
  return null;
});
