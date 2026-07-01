import type { ActionType } from "~/shared/actions/actionRegistry.js";

// Maps physical keyboard strings to structural Action Types
export const inputBindings: Record<string, ActionType> = {
  w: "MOVE",
  s: "MOVE",
  a: "MOVE",
  d: "MOVE",

  // Easy to expand down the line:
  // space: "JUMP",
  // shift: "DASH",
  // 1: "USE_SKILL_1",
};
