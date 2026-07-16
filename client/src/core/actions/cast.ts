import { Log } from "~/shared/core/Logger";
import Character from "~/core/Character";
import type { ActionHandler } from "~/core/actions/types";

export const Cast: ActionHandler = {
  execute: ({ data, character, game }): void => {
    if (!game) return;
    if (!character) return;

    try {
      console.log("bingo ooo cast spooky spell!", character.name);
    } catch (error) {
      Log.DATA.ERROR(`Could not load data: ${error}`);
    }
  },
};
