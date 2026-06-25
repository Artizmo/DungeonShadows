import type { IResponseHandler } from "~/core/game/@types";
import characterConnected from "~/_lib/responses/characterConnected";
import worldSync from "~/_lib/responses/worldSync";

export const RESPONSE_REGISTRY: Record<string, new () => IResponseHandler> = {
  // Core
  CHARACTER_CONNECTED: characterConnected,
  WORLD_SYNC: worldSync,
};
