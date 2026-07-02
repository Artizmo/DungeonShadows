import { MapChunk as MapChunkLayout } from "~/shared/network/packet-structures/map-chunk.js";
import type { IActionContext, IMapChunkAction } from "~/core/actions/types.js";

export const MapChunk = {
  execute(payload: IMapChunkAction, { game }: IActionContext): void {
    const map = MapChunkLayout.destructure(payload);
    game.renderer!.loadMap(map);
  },
};
