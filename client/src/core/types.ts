import type { ActionType } from "~/shared/core/types";

export interface InputAction {
  sequenceId: number;
  deltaTime: number;
  actionType: ActionType;
  // This can hold any object structure (e.g., { x: 1, y: 0 } or { spellId: 42, targetId: "abc" })
  payload: any;
}

export interface WorldState {
  character: {
    stats: {
      hp: number;
      maxHp: number;
      mana: number;
      maxMana: number;
    };
    position: {
      x: number;
      y: number;
    };
  };
}
