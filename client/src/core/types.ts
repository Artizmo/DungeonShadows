import type Game from "~/core/game/Game";
import type Character from "~/core/character/Character";

export interface ResponseContext {
  character?: Character;
  game: Game;
  data: Uint8Array;
}

export interface IResponseHandler {
  execute(context: ResponseContext): void | Promise<void>;
}
