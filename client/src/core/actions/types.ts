import type Character from "../Character";
import type Game from "../Game";
import type { Coords } from "./move";

export interface ActionHandlerContext {
  data: any;
  character?: Character;
  game?: Game;
}

export type ActionPhysicsContext = Coords;

export interface ActionHandler {
  execute(actionHandlerContext: ActionHandlerContext): void;
  applyPhysics?(
    actionHandlerContext: ActionHandlerContext,
  ): ActionPhysicsContext;
}
