import type { ActionHandler } from "~/core/actions/types";
import { Join } from "~/core/actions/join";
import { LoadMap } from "~/core/actions/load-map";
import { ActionType } from "~/shared/core/types";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.JOIN, Join);
ActionRegistry.set(ActionType.LOAD_MAP, LoadMap);
