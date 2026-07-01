import type { ICoords, IMovePayload } from "~/shared/types.js";
import type { IAction, IActionContext } from "./types.js";

export const MoveAction = {
  type: "MOVE" as const,

  getPayload(keys: Record<string, boolean>): IMovePayload | null {
    const isMoving = keys.w || keys.s || keys.a || keys.d;
    if (!isMoving) return null;

    return {
      w: !!keys.w,
      s: !!keys.s,
      a: !!keys.a,
      d: !!keys.d,
    };
  },

  execute(payload: IMovePayload, context: IActionContext): void {
    const { character } = context;
    if (!character.pendingActions) return;

    // Verify that the character can move (e.g., is alive, not stunned, etc.)

    // Move
    this.updateState(payload, context);

    character.sequenceId!++;
    character.pendingActions.push({
      type: MoveAction.type,
      sequenceId: character.sequenceId ?? 0,
      payload,
    });
  },

  updateState: function (payload: IMovePayload, context: IActionContext): void {
    const { character } = context;
    if (!character.speed) return;

    const safePayload = payload || {
      w: false,
      s: false,
      a: false,
      d: false,
    };
    const { w, s, a, d } = safePayload;

    const distance = character.speed * (1 / 60);

    if (w) character.position.y -= distance;
    if (s) character.position.y += distance;
    if (a) character.position.x -= distance;
    if (d) character.position.x += distance;

    character.position.x = Math.round(character.position.x * 100) / 100;
    character.position.y = Math.round(character.position.y * 100) / 100;
  },

  reconcile: function (
    payload: ICoords,
    context: IActionContext,
    lastSequence: number,
  ): void {
    const { character } = context;
    const { x, y } = payload;
    if (!character.pendingActions?.length) return;

    character.position.x = x;
    character.position.y = y;
    // 2. The O(1) Pluck
    while (character.pendingActions[0].sequenceId <= lastSequence) {
      character.pendingActions.shift();
    }
    // 3. Re-Simulation Pass
    for (const action of character.pendingActions) {
      // Each unacknowledged input is re-simulated using its saved structural delta step
      this.updateState(action.payload, context);
    }
  },
} satisfies IAction<IMovePayload>;
