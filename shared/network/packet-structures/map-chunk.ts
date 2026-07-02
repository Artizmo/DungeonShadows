import { GameProtocol } from "~/shared/network/generated/index.js";
import type { IPacketLayout } from "~/shared/network/types.js";

export const MapChunk: IPacketLayout = {
  structure: (payload, sequenceId, targetId) => {
    // payload can be a direct chunk object passed by the server's map cache/generator
    return {
      type: GameProtocol.MessageType.GAME, // Routed as network infrastructure data
      actionType: GameProtocol.ActionType.MAP_CHUNK, // Assuming MAP_CHUNK exists in your enums
      sequenceId,
      targetId,

      // 🟢 Pack the chunk's grid coordinates into the ints array
      ints: [payload.x ?? 0, payload.y ?? 0],

      floats: [],
      strings: [],

      // 🟢 Pass the raw map slice bytes straight down the channel
      bytes: payload.textureBytes ?? null,
    };
  },

  destructure: (message) => ({
    // Extract the chunk location back out
    x: message.ints?.[0] ?? 0,
    y: message.ints?.[1] ?? 0,

    // Snag the raw compressed image/tile binary data
    imageBytes: message.bytes ?? null,
  }),
};
