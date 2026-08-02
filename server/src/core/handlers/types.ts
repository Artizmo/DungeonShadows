import type { Entity } from "~/shared/core/types";
import type World from "../World";

export enum CommandType {
  MOVE_UP = "MOVE_UP",
  MOVE_DOWN = "MOVE_DOWN",
  MOVE_LEFT = "MOVE_LEFT",
  MOVE_RIGHT = "MOVE_RIGHT",
  CAST_SPELL = "CAST_SPELL",
  MENU_TOGGLE = "MENU_TOGGLE",
  UI_UP = "UI_UP",
  UI_DOWN = "UI_DOWN",
  UI_SELECT = "UI_SELECT",
}
export type ActionPhysicsContext = { x: number; y: number };

export interface ActionHandler<TData = unknown> {
  handle(
    character: Entity,
    data: TData,
    sequenceId: number,
    deltaTime: number,
    world: World
  ): void;
}
