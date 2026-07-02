import { GameProtocol } from "~/shared/network/generated/index";
import { Move } from "~/core/actions/move";
import { Spawn } from "~/core/actions/spawn";
import { MapChunk } from "~/core/actions/map-chunk";
import type { ActionHandler } from "~/core/actions/types";

export const ActionRegistry = new Map<number, ActionHandler>([
  [GameProtocol.ActionType.MOVE, Move],
  [GameProtocol.ActionType.SPAWN, Spawn],
  [GameProtocol.ActionType.MAP_CHUNK, MapChunk],
]);
