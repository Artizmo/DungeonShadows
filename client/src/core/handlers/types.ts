import type Character from "../Character";
import type Game from "../Game";

export interface ActionHandlerContext {
  data: any;
  character?: Character;
  game?: Game;
}

export interface ActionHandler {
  handle(actionHandlerContext: ActionHandlerContext): void;
}
