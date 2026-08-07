import type { ActionClientHandler } from "~/shared/core/types";
import { ActionType } from "~/shared/core/types";
// import { Connect } from "~/core/handlers/connect";
import { UpdateZone } from "~/core/handlers/update-zone";
import { Move } from "~/shared/core/lib/movement/client-actions";
import { Cast } from "~/core/handlers/cast";

export const ActionRegistry = new Map<ActionType, ActionClientHandler>();

// ActionRegistry.set(ActionType.CONNECT, Connect);
ActionRegistry.set(ActionType.ZONE_UPDATE, UpdateZone);
ActionRegistry.set(ActionType.MOVE, Move);
ActionRegistry.set(ActionType.CAST, Cast);
