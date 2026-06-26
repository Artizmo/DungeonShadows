import type { IResponseHandler, ResponseContext } from "~/core/game/@types";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    game.character = data;
    game.events.emit("CHARACTER_UPDATE", data);
  }
}
