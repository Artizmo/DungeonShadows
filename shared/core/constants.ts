import type { GameConfig } from "./types.js";

const FPS = 60;

export const LoopConfig: GameConfig = {
  speed: 200,
  tickRate: 1000 / 20, // 20Hz
  frameRate: 1000 / FPS, // 60Hz fixed
  frameSize: 600,
  interpolationDelay: 100,
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
