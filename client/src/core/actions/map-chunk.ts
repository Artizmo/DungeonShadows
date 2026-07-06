import { MapChunk as MapChunkLayout } from "~/shared/network/packet-structures/map-chunk";
import type { IActionContext, IMapChunk } from "~/shared/core/actions/types";

export const MapChunk = {
  execute(payload: IMapChunk, { game }: IActionContext): void {
    const map = MapChunkLayout.destructure(payload);
    game.renderer!.loadMap(map);
  },
};
