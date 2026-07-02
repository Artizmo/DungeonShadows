import { GameProtocol } from "~/shared/network/generated/index.js";
import { Move } from "~/core/actions/move.js";
import { Spawn } from "~/core/actions/spawn.js";
import { MapChunk } from "~/core/actions/map-chunk.js";
import type { ActionHandler } from "~/core/actions/types.js";

export const ActionRegistry = new Map<number, ActionHandler>([
  [GameProtocol.ActionType.MOVE, Move],
  [GameProtocol.ActionType.SPAWN, Spawn],
  [GameProtocol.ActionType.MAP_CHUNK, MapChunk],
]);
