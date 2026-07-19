import type { ActionHandler } from "~/core/actions/types";
import { ActionType } from "~/shared/core/types";
import { Join } from "~/core/actions/join";
import { UpdateZone } from "~/core/actions/update-zone";
import { Move } from "~/core/actions/move";
import { Cast } from "~/core/actions/cast";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.JOIN, Join);
ActionRegistry.set(ActionType.ZONE_UPDATE, UpdateZone);
ActionRegistry.set(ActionType.MOVE, Move);
ActionRegistry.set(ActionType.CAST, Cast);
