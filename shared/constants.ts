import type { Config } from "./core/types.js";

export const LOOP_CONFIG: Config = {
  cycleRate: 0.016666667, // Now matching 60Hz processing chunks
  tickRate: 0.05, // Sync window updates every 50ms (20 network updates a sec)
  cycleSize: 600, // Unified reset index timeline maximum boundary
};

export const GAME_CONFIG = {
  SPEED: 200,
  SERVER_TICK_RATE: 1000 / 20, // 20Hz
  CLIENT_TICK_RATE: 1000 / 60, // 60Hz fixed
  INTERPOLATION_DELAY: 100,
};

export const ActionType = {
  SYSTEM: 0,
  MOVE: 1,
  CAST: 2,
};

export const INPUT_DICTIONARY: Record<
  string,
  Record<string, Record<string, string>>
> = {
  DEFAULT: {
    keyboard: {
      w: "MOVE_UP",
      a: "MOVE_LEFT",
      s: "MOVE_DOWN",
      d: "MOVE_RIGHT",
      e: "CAST_SPELL",
      escape: "MENU_TOGGLE",
    },
    gamepad: {
      b12: "MOVE_UP",
      b14: "MOVE_LEFT",
      b13: "MOVE_DOWN",
      b15: "MOVE_RIGHT",
      b0: "CAST_SPELL",
      b9: "MENU_TOGGLE",
      b1: "MENU_TOGGLE",
      a1_neg: "MOVE_UP",
      a1_pos: "MOVE_DOWN",
      a0_neg: "MOVE_LEFT",
      a0_pos: "MOVE_RIGHT",
    },
  },
  PAUSE_MENU: {
    keyboard: {
      escape: "MENU_TOGGLE",
      w: "UI_UP",
      s: "UI_DOWN",
      enter: "UI_SELECT",
    },
    gamepad: {
      b1: "MENU_TOGGLE",
      b9: "MENU_TOGGLE",
      b12: "UI_UP",
      b13: "UI_DOWN",
      b0: "UI_SELECT",
    },
  },
};
