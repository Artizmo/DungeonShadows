import type { ICommandHandler } from "~/types/game";
import MoveCommand from "~/lib/requests/move";

export const REQUEST_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core

  // Character
  MOVE_REQUEST: MoveCommand,
};
