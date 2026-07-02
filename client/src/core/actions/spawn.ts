import Character from "~/core/Character";
import { Spawn as SpawnLayout } from "~/shared/network/packet-structures/spawn.js";
import type { IActionContext, IMoveAction } from "~/core/actions/types.js";

export const Spawn = {
  execute(payload: IMoveAction, { game }: IActionContext): void {
    const data = SpawnLayout.destructure(payload);
    const character = new Character(data);
    game.world.join(character);
    game.events.emit("CHARACTER_UPDATE", character);
  },
};
