import { ActionType } from "~/shared/core/types";

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

export const inputDictionary: Record<
  string,
  Record<string, Record<string, CommandType>>
> = {
  DEFAULT: {
    keyboard: {
      w: CommandType.MOVE_UP,
      a: CommandType.MOVE_LEFT,
      s: CommandType.MOVE_DOWN,
      d: CommandType.MOVE_RIGHT,
      e: CommandType.CAST_SPELL,
      escape: CommandType.MENU_TOGGLE,
    },
    gamepad: {
      b12: CommandType.MOVE_UP,
      b14: CommandType.MOVE_LEFT,
      b13: CommandType.MOVE_DOWN,
      b15: CommandType.MOVE_RIGHT,
      b0: CommandType.CAST_SPELL,
      b9: CommandType.MENU_TOGGLE,
      b1: CommandType.MENU_TOGGLE,
      a1_neg: CommandType.MOVE_UP,
      a1_pos: CommandType.MOVE_DOWN,
      a0_neg: CommandType.MOVE_LEFT,
      a0_pos: CommandType.MOVE_RIGHT,
    },
  },
  PAUSE_MENU: {
    keyboard: {
      escape: CommandType.MENU_TOGGLE,
      w: CommandType.UI_UP,
      s: CommandType.UI_DOWN,
      enter: CommandType.UI_SELECT,
    },
    gamepad: {
      b1: CommandType.MENU_TOGGLE,
      b9: CommandType.MENU_TOGGLE,
      b12: CommandType.UI_UP,
      b13: CommandType.UI_DOWN,
      b0: CommandType.UI_SELECT,
    },
  },
};

export const actionDictionary: Record<CommandType, ActionType | null> = {
  // Movement
  [CommandType.MOVE_UP]: ActionType.MOVE,
  [CommandType.MOVE_DOWN]: ActionType.MOVE,
  [CommandType.MOVE_LEFT]: ActionType.MOVE,
  [CommandType.MOVE_RIGHT]: ActionType.MOVE,

  // Gameplay Actions
  [CommandType.CAST_SPELL]: ActionType.CAST,

  // UI / Meta Actions
  [CommandType.MENU_TOGGLE]: null,
  [CommandType.UI_UP]: null,
  [CommandType.UI_DOWN]: null,
  [CommandType.UI_SELECT]: null,
};
