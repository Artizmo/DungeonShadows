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

  execute(
    payload: IMovePayload,
    context: IActionContext,
    deltaTime: number,
  ): void {
    const { character } = context;
    if (!character.pendingActions) return;

    // 🟢 1. Advance state locally using current frame delta (Prediction Pass)
    this.updateState(payload, context, deltaTime);

    // 🟢 2. Increment sequence index securely
    character.sequenceId!++;

    // 🟢 3. Log history with the EXACT delta time utilized for this specific frame
    character.pendingActions.push({
      type: MoveAction.type,
      sequenceId: character.sequenceId ?? 0,
      payload,
      deltaTime, // 👈 Stored directly for high-precision rewind/replay loop
    });
  },

  // 🟢 4. Accept a dynamic delta time instead of hardcoding a 60Hz step
  updateState: function (
    payload: IMovePayload,
    context: IActionContext,
    deltaTime: number = 1 / 60,
  ): void {
    const { character } = context;
    if (!character.speed || !payload) return;

    const { w, s, a, d } = payload;

    // Use the dynamic time delta to keep speed uniform across variable hardware refresh rates
    const distance = character.speed * deltaTime;

    if (w) character.position.y -= distance;
    if (s) character.position.y += distance;
    if (a) character.position.x -= distance;
    if (d) character.position.x += distance;

    // 🟢 5. Floating Point Integrity Maintained
    // full 64-bit precision accuracy remains intact for fluid interpolation tracking.
  },

  reconcile: function (
    payload: ICoords,
    context: IActionContext,
    lastSequence: number,
  ): void {
    const { character } = context;
    const { x, y } = payload;
    if (!character.pendingActions) return;

    // 🟢 6. Snap client truth to authoritative baseline server snapshot coordinates
    character.position.x = x;
    character.position.y = y;

    // 🟢 7. Pluck processed historical actions acknowledged by the server context frame
    while (
      character.pendingActions.length > 0 &&
      character.pendingActions[0].sequenceId <= lastSequence
    ) {
      character.pendingActions.shift();
    }

    // 🟢 8. Re-simulate all unacknowledged actions to seamlessly bridge current position truth
    for (const action of character.pendingActions) {
      // Replaying with the exact original deltaTime prevents micro-stuttering on variable monitors
      this.updateState(action.payload, context, action.deltaTime!);
    }
  },
} satisfies IAction<IMovePayload>;
