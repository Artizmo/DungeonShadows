import { GameProtocol } from "~/shared/network/generated/index.js";

// Maps physical keyboard strings to structural Action Types
export const inputBindings: Record<string, GameProtocol.ActionType> = {
  w: GameProtocol.ActionType.MOVE,
  s: GameProtocol.ActionType.MOVE,
  a: GameProtocol.ActionType.MOVE,
  d: GameProtocol.ActionType.MOVE,

  // Easy to expand down the line:
  // space: "JUMP",
  // shift: "DASH",
  // 1: "USE_SKILL_1",
};
