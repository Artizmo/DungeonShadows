import type Character from "../Character";
import type Game from "../Game";

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

export interface ActionHandlerContext {
  data: any;
  character?: Character;
  game?: Game;
}

export type ActionPhysicsContext = { x: number; y: number };

export interface ActionHandler {
  handle(actionHandlerContext: ActionHandlerContext): void;
}
