import type { ICommandHandler } from "~/core/game/@types";
import CheckInventory from "~/_lib/commands/inventory";
import Sleep from "~/_lib/commands/sleep";
import Score from "~/_lib/commands/score";
import { Drink } from "~/_lib/commands/consumable";

export const COMMAND_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core

  // Character
  SCORE: Score,
  CHECK_INVENTORY: CheckInventory,
  SLEEP: Sleep,

  // Consumables
  DRINK: Drink,
};
