import { Deserialize } from "~/shared/serialize/deserializer";
import type { IResponseHandler, ResponseContext } from "~/core/game/@types";

export default class MapChunkedResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    const map = Deserialize.mapChunk(data);

    game.renderer!.loadMap(map);
  }
}
