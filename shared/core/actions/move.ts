import { GameProtocol } from "~/shared/network/generated/index";
import type { ICoords } from "~/shared/core/types";
import type { IActionContext, IMoveAction } from "~/core/actions/types";

export const Move = {
  getPayload(
    keys: Record<string, boolean>,
    deltaTime: number,
  ): IMoveAction | null {
    const isMoving = keys.w || keys.s || keys.a || keys.d;
    if (!isMoving) return null;

    return {
      w: !!keys.w,
      s: !!keys.s,
      a: !!keys.a,
      d: !!keys.d,
      deltaTime,
    };
  },

  execute(payload: IMoveAction, context: IActionContext): void {
    const { character } = context;
    if (!character.pendingActions) return;

    this.updateState(payload, context);
    character.sequenceId!++;

    character.pendingActions.push({
      type: GameProtocol.ActionType.MOVE,
      sequenceId: character.sequenceId ?? 0,
      payload,
    });
  },

  updateState: function (payload: IMoveAction, context: IActionContext): void {
    const { character } = context;
    if (!character.speed || !payload) return;

    const deltaTime = payload.deltaTime ?? 1 / 60;
    const { w, s, a, d } = payload;
    const distance = character.speed * deltaTime;

    if (w) character.position.y -= distance;
    if (s) character.position.y += distance;
    if (a) character.position.x -= distance;
    if (d) character.position.x += distance;
  },

  reconcile: function (
    payload: ICoords,
    context: IActionContext,
    lastSequence: number,
  ): void {
    const { character } = context;
    const { x, y } = payload;
    if (!character.pendingActions) return;

    character.position.x = x;
    character.position.y = y;

    while (
      character.pendingActions.length > 0 &&
      character.pendingActions[0].sequenceId <= lastSequence
    ) {
      character.pendingActions.shift();
    }

    for (const action of character.pendingActions) {
      this.updateState(action.payload, context);
    }
  },
};
