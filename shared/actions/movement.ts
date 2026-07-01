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

    // 🟢 1. Advance state locally (Prediction Pass)
    this.updateState(payload, context);

    // 🟢 2. Increment sequence index securely
    character.sequenceId!++;

    // 🟢 3. Log history (DO NOT wipe this collection at the end of Game.tick!)
    character.pendingActions.push({
      type: MoveAction.type,
      sequenceId: character.sequenceId ?? 0,
      payload,
    });
  },

  // 🟢 4. Accept a dynamic delta time (dt) instead of hardcoding 1/60
  updateState: function (
    payload: IMovePayload,
    context: IActionContext,
    dt: number = 1 / 60,
  ): void {
    const { character } = context;
    if (!character.speed || !payload) return;

    const { w, s, a, d } = payload;

    // Use the dynamic fixed network tick time delta
    const distance = character.speed * dt;

    if (w) character.position.y -= distance;
    if (s) character.position.y += distance;
    if (a) character.position.x -= distance;
    if (d) character.position.x += distance;

    // 🟢 5. REMOVED the aggressive Math.round() truncation!
    // Let JavaScript maintain full 64-bit precision floating accuracy for fluid LERPs.
  },

  reconcile: function (
    payload: ICoords,
    context: IActionContext,
    lastSequence: number,
  ): void {
    const { character } = context;
    const { x, y } = payload;
    if (!character.pendingActions) return;

    // 🟢 Snap client truth to authoritative baseline server snapshot coordinates
    character.position.x = x;
    character.position.y = y;

    // Pluck processed historical actions acknowledged by the server frame context
    while (
      character.pendingActions.length > 0 &&
      character.pendingActions[0].sequenceId <= lastSequence
    ) {
      character.pendingActions.shift();
    }

    // Re-simulate all unacknowledged actions to seamlessly bridge current position truth
    for (const action of character.pendingActions) {
      this.updateState(action.payload, context);
    }
  },
} satisfies IAction<IMovePayload>;
