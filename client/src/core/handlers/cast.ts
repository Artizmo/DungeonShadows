import type { ActionHandler } from "~/core/handlers/types";

export const Cast: ActionHandler = {
  handle: ({ game }): void => {
    if (!game) return;
    if (!game.world.character) return;

    const { character } = game.world;

    console.log("bingo ooo cast spooky spell!", character.name);
  },
};
