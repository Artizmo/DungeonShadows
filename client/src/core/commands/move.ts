import { ActionType } from "~/shared/core/types";
import type { ActionData } from "~/core/commands/index";

export const Move = {
  execute(activeActions: Set<string>): ActionData {
    let dx = 0,
      dy = 0;

    // Since we passed the whole set, we can easily check for diagonals
    if (activeActions.has("MOVE_UP")) dy -= 1;
    if (activeActions.has("MOVE_DOWN")) dy += 1;
    if (activeActions.has("MOVE_LEFT")) dx -= 1;
    if (activeActions.has("MOVE_RIGHT")) dx += 1;

    if (dx === 0 && dy === 0) return null;

    return {
      isLocal: false,
      type: ActionType.MOVE,
      payload: { x: dx, y: dy },
    };
  },
};
