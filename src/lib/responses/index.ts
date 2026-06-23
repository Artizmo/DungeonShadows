import type { IResponseHandler } from "~/types/game";
import characterConnected from "~/lib/responses/characterConnected";
import worldSync from "~/lib/responses/worldSync";

export const RESPONSE_REGISTRY: Record<string, new () => IResponseHandler> = {
  // Core
  CHARACTER_CONNECTED: characterConnected,
  WORLD_SYNC: worldSync,
};
