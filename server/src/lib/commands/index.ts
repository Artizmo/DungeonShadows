import type { ICommandHandler } from "~/types/game";
import CheckInventory from "~/lib/commands/inventory";
import Sleep from "~/lib/commands/sleep";
import Score from "~/lib/commands/score";
import { Drink } from "~/lib/commands/consumable";
import MoveCommand from "~/lib/requests/move";

export const COMMAND_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core

  // Character
  MOVE_REQUEST: MoveCommand,
  SCORE: Score,
  CHECK_INVENTORY: CheckInventory,
  SLEEP: Sleep,

  // Consumables
  DRINK: Drink,
};
