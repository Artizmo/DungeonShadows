import { Log } from "~/shared/core/Logger";
import Character from "~/core/Character";
import type { ActionHandler } from "~/core/actions/types";
import Zone from "../Zone";

export const Join: ActionHandler = {
  execute: ({ data, game }): void => {
    if (!game) return;

    const { chunks, toUnloadKeys } = data;
    const character = new Character(data.character);
    character.zone = new Zone(data.zone);
    game.world.add(character);
    game!.renderer.loadMap(chunks, toUnloadKeys);
    game.events.emit("game_update");
  },
};
