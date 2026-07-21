import type { ActionType } from "~/shared/core/types";

export interface StateRecord {
  sequenceId: number;
  tick: number;
  actions: Set<ActionType>;
  state: WorldState;
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
