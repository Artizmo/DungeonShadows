import { GameProtocol } from "~/shared/network/generated/index.js";
import type { IPacketLayout } from "~/shared/network/types.js";

export const Move: IPacketLayout = {
  structure: (action, sequenceId, targetId) => {
    // 🟢 Checks if this is an authoritative server entity update or a client input frame payload
    const isServerAuthoritativeUpdate = action.position !== undefined;
    const payload = isServerAuthoritativeUpdate ? action : action.payload;

    return {
      type: GameProtocol.MessageType.GAME,
      actionType: GameProtocol.ActionType.MOVE,
      sequenceId,
      targetId,

      ints: isServerAuthoritativeUpdate
        ? []
        : [
            payload.w ? 1 : 0,
            payload.s ? 1 : 0,
            payload.a ? 1 : 0,
            payload.d ? 1 : 0,
          ],

      floats: isServerAuthoritativeUpdate
        ? [action.position.x, action.position.y]
        : [action.deltaTime],

      strings: action.strings ?? [],
      bytes: action.bytes ?? undefined,
    };
  },

  destructure: (message) => ({
    payload: {
      w: message.ints?.[0] === 1,
      s: message.ints?.[1] === 1,
      a: message.ints?.[2] === 1,
      d: message.ints?.[3] === 1,
    },
    position: {
      x: message.floats?.[0] ?? 0,
      y: message.floats?.[1] ?? 0,
    },
  }),
};
