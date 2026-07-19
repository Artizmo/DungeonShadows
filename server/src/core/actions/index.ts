import type { ActionHandler } from "~/core/actions/types";
import { Join } from "~/core/actions/join";
import { Leave } from "~/core/actions/leave";
import { Move } from "~/core/actions/move";
import { ActionType } from "~/shared/core/types";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.JOIN, Join);
ActionRegistry.set(ActionType.LEAVE, Leave);
ActionRegistry.set(ActionType.MOVE, Move);
