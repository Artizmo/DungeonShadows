import type { ICommandHandler } from "~/types/game";
import JoinWorld from "~/lib/commands/joinWorld";
import LeaveWorld from "~/lib/commands/leaveWorld";
import CheckInventory from "~/lib/commands/inventory";
import Sleep from "~/lib/commands/sleep";
import Score from "~/lib/commands/score";
import { Drink } from "~/lib/commands/consumable";

export const COMMAND_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core
  "JOIN_WORLD": JoinWorld,
  "LEAVE_WORLD": LeaveWorld,

  // Character
  "SCORE": Score,
  "CHECK_INVENTORY": CheckInventory,
  "SLEEP": Sleep,

  // Consumables
  "DRINK": Drink
};