import type Game from "../Game";

export interface ActionHandler {
  execute(payload: any, game: Game): void;
}
