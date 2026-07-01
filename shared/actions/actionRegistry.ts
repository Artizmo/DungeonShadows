import { MoveAction } from "~/shared/actions/movement.js";

export const actionsRegistry = {
  [MoveAction.type]: MoveAction,
};

export type ActionType = keyof typeof actionsRegistry;
