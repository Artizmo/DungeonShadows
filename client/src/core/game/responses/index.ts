import type { IResponseHandler } from "~/core/game/@types";
import characterConnected from "~/core/game/responses/characterConnected";
import worldSync from "~/core/game/responses/worldSync";
import { OpCode } from "~/shared/proto/@types";

export const RESPONSE_REGISTRY: Record<string, new () => IResponseHandler> = {
  // Core
  [OpCode[OpCode.CHARACTER_SPAWN]]: characterConnected,
  WORLD_SYNC: worldSync,
};
