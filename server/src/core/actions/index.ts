import type { ActionHandler } from "~/core/actions/types";
import { Join } from "~/core/actions/join";
import { ActionType } from "~/shared/core/types";

export const ActionRegistry = new Map<ActionType, ActionHandler>();

ActionRegistry.set(ActionType.JOIN, Join);
