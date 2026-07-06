import * as GameProtocol from "~/shared/network/generated/game-protocol.js";
import { Spawn } from "~/core/actions/spawn";
import type { ActionHandler } from "~/shared/core/actions/types.js";

export const ActionRegistry = new Map<number, ActionHandler>([
  [GameProtocol.ActionType.SPAWN, Spawn],
]);
