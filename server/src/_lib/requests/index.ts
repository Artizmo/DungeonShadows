import type { ICommandHandler } from "~/core/game/@types";
import MoveCommand from "~/_lib/requests/move";

export const REQUEST_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core

  // Character
  MOVE_REQUEST: MoveCommand,
};
