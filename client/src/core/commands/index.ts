import { Move } from "~/core/commands/move";
import type { ActionType } from "~/shared/core/types";

export enum CommandType {
  MOVE_UP = "MOVE_UP",
  MOVE_DOWN = "MOVE_DOWN",
  MOVE_LEFT = "MOVE_LEFT",
  MOVE_RIGHT = "MOVE_RIGHT",
  CAST_SPELL = "CAST_SPELL",
  MENU_TOGGLE = "MENU_TOGGLE",
  UI_UP = "UI_UP",
  UI_DOWN = "UI_DOWN",
  UI_SELECT = "UI_SELECT",
}

interface ActionContext {
  isLocal: boolean;
  type: ActionType;
  payload: { x: number; y: number };
}

export type ActionData = ActionContext | null;

export interface CommandHandler {
  execute(activeActions: Set<string>): ActionData;
}

export const CommandRegistry = new Map<CommandType, CommandHandler>();

CommandRegistry.set(CommandType.MOVE_UP, Move);
CommandRegistry.set(CommandType.MOVE_DOWN, Move);
CommandRegistry.set(CommandType.MOVE_LEFT, Move);
CommandRegistry.set(CommandType.MOVE_RIGHT, Move);
// CommandRegistry.set("COMMAND_UI", (isActive, consumeJustPressed) => {
//   if (consumeJustPressed("MENU_TOGGLE"))
//     return { isLocal: true, execute: (g) => g.menuManager.toggleMenu() };
//   return null;
// });
