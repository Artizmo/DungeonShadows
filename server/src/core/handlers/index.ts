import type { ActionHandler } from "~/core/handlers/types";
import { Connect } from "~/core/handlers/connect";
import { Disconnect } from "~/core/handlers/disconnect";
import { Move } from "~/core/handlers/move";
import { ActionType } from "~/shared/core/types";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.CONNECT, Connect);
ActionRegistry.set(ActionType.DISCONNECT, Disconnect);
ActionRegistry.set(ActionType.MOVE, Move);
