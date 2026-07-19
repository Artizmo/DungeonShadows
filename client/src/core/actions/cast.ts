import type { ActionHandler } from "~/core/actions/types";

export const Cast: ActionHandler = {
  execute: ({ character, game }): void => {
    if (!game) return;
    if (!character) return;

    console.log("bingo ooo cast spooky spell!", character.name);
  },
};
