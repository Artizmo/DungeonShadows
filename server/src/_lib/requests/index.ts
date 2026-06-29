import { PlayerJoinHandler } from "~/_lib/requests/playerJoin";
import BatchInputRequest from "~/_lib/requests/batchInput";

export const REQUEST_REGISTRY = {
  PLAYER_JOIN: PlayerJoinHandler,
  CLIENT_BATCH_INPUT: BatchInputRequest,
};
