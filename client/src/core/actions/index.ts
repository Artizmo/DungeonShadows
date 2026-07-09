import type { ActionHandler } from "~/core/actions/types";
import { ActionType } from "~/shared/core/types";
import { Join } from "~/core/actions/join";
import { LoadMap } from "~/core/actions/load-map";
import { Move } from "~/core/actions/move";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.JOIN, Join);
ActionRegistry.set(ActionType.LOAD_MAP, LoadMap);
ActionRegistry.set(ActionType.MOVE, Move);
