import type Game from "~/core/Game";
import type Character from "~/core/Character";

export interface ResponseContext {
  character?: Character;
  game: Game;
  data: Uint8Array;
}

export interface IResponseHandler {
  execute(context: ResponseContext): void | Promise<void>;
}
