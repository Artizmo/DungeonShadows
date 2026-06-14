import type { ICommandHandler } from "~/types/game";
import JoinWorld from "~/lib/commands/joinWorld";
import LeaveWorld from "~/lib/commands/leaveWorld";
import CheckInventory from "~/lib/commands/inventory";
import { Drink } from './consumable';
import SleepCommand from './sleep';

export const COMMAND_REGISTRY: Record<string, new () => ICommandHandler> = {
  // Core
  "JOIN_WORLD": JoinWorld,
  "LEAVE_WORLD": LeaveWorld,

  // Character
  "CHECK_INVENTORY": CheckInventory,
  "SLEEP": SleepCommand,

  // Consumables
  "DRINK": Drink
};