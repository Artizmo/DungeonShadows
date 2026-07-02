import { GameProtocol } from "~/shared/network/generated/index.js";
import type { IPacketLayout } from "~/shared/network/types.js";
import type { ICharacter } from "~/shared/core/types.js";

export const Spawn: IPacketLayout = {
  structure: (character: ICharacter, sequenceId, targetId) => {
    return {
      type: GameProtocol.MessageType.GAME,
      actionType: GameProtocol.ActionType.SPAWN,
      sequenceId,
      targetId,

      // 🟢 Packing strict ICharacter primitives sequentially
      ints: [
        character.id,
        character.player.id,
        character.level,
        character.isAlive ? 1 : 0,
        character.stats?.hp ?? 0,
        character.stats?.maxHp ?? 0,
      ],

      // 🟢 Packing floating-point positional metrics
      floats: [
        character.position?.x ?? 0,
        character.position?.y ?? 0,
        character.speed ?? 0,
      ],

      // 🟢 Packing identities
      strings: [
        character.name ?? "",
        character.zone.id ?? "",
        character.zone.areaId ?? "",
        character.zone.mapName ?? "",
      ],

      bytes: undefined,
    };
  },

  destructure: (message) => {
    // 🟢 Exact symmetrical mirror unpacking into an ICharacter structural shape
    const character: ICharacter = {
      id: message.ints?.[0] ?? 0,
      name: message.strings?.[0] ?? "",
      player: message.ints?.[1] ?? 0,
      level: message.ints?.[2] ?? 1,
      isAlive: message.ints?.[3] === 1,
      stats: {
        hp: message.ints?.[4] ?? 0,
        maxHp: message.ints?.[5] ?? 0,
      },
      position: {
        x: message.floats?.[0] ?? 0,
        y: message.floats?.[1] ?? 0,
      },
      zone: {
        id: message.strings?.[1] ?? 0,
        areaId: message.strings?.[2] ?? 0,
        mapName: message.strings?.[3] ?? 0,
      },
      speed: message.floats?.[2] ?? 0,
    };

    return character;
  },
};
