import Character from "~/core/Character";
import type { ActionHandler } from "~/core/actions/types";
import Zone from "../Zone";

export const Join: ActionHandler = {
  execute: ({ data, game }): void => {
    if (!game) return;

    const { chunks, unchunks } = data;
    const character = new Character(data.character);
    const zone = new Zone(data.zone);
    character.zone = zone;
    game.world.areas.get(zone.areaId)?.addZone(zone);
    game.world.add(character);
    game!.renderer.loadMap(chunks, unchunks);
    game.events.emit("game_update");
  },
};
