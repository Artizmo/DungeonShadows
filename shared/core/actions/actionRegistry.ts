import * as GameProtocol from "~/shared/network/generated/game-protocol.js";
import { Move } from "~/shared/core/actions/move.js";
import type { ActionHandler } from "~/shared/core/actions/types.js";

export const ActionRegistry = new Map<number, ActionHandler>([
  [GameProtocol.ActionType.MOVE, Move],
]);
