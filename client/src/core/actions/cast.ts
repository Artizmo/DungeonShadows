import type { ActionHandler } from "~/core/actions/types";

export const Cast: ActionHandler = {
  execute: ({ game }): void => {
    if (!game) return;
    if (!game.world.character) return;

    const { character } = game.world;

    // console.log("bingo ooo cast spooky spell!", character.name);
  },
};
