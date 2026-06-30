import { Deserialize } from "~/shared/serialize/deserializer";
import type { IResponseHandler, ResponseContext } from "~/core/game/@types";
import Character, { type ICharacter } from "~/core/character/Character";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    try {
      Deserialize.packet(data, {
        onEntitySpawn: (payload) => {
          console.log(
            "🚀 Deserialization successful! Spawned character:",
            payload.name,
          );
        },
      });
    } catch (error) {}

    // game.world!.character = new Character(character);
    // game.events.emit("CHARACTER_UPDATE", character);
  }
}
