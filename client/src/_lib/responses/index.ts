import type { IResponseHandler } from "~/core/game/@types";
import characterConnected from "~/_lib/responses/characterConnected";
import mapChunked from "~/_lib/responses/mapChunked";
import worldState from "~/_lib/responses/worldState";
import { OpCode } from "~/shared/serialize/@types";

export const RESPONSE_REGISTRY: Record<string, new () => IResponseHandler> = {
  // Core
  [OpCode[OpCode.CHARACTER_SPAWN]]: characterConnected,
  [OpCode[OpCode.MAP_CHUNK]]: mapChunked,
  [OpCode[OpCode.WORLD_STATE_UPDATE]]: worldState,
};
