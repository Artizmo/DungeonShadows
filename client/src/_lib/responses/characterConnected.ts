import { Deserialize } from "~/shared/serialize/deserializer";
import type { IResponseHandler, ResponseContext } from "~/core/game/@types";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    const character = Deserialize.character(data);

    game.world!.character = character;
    game.events.emit("CHARACTER_UPDATE", character);
  }
}
