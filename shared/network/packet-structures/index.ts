import { GameProtocol } from "~/shared/network/generated/index.js";
import type { IPacketLayout } from "~/shared/network/types.js";
import { Move } from "~/shared/network/packet-structures/move.js";
import { Spawn } from "~/shared/network/packet-structures/spawn.js";
import { MapChunk } from "~/shared/network/packet-structures/map-chunk.js";

export const PacketRegistry = new Map<number, IPacketLayout>([
  [GameProtocol.ActionType.MOVE, Move],
  [GameProtocol.ActionType.SPAWN, Spawn],
  [GameProtocol.ActionType.MAP_CHUNK, MapChunk],
]);
