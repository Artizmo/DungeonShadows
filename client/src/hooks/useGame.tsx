import { useSyncExternalStore } from "react";
import gameEngine from "~/core";
import type Game from "~/core/Game";

export function useGame<T>(selector: (game: Game) => T): T {
  return useSyncExternalStore(
    // 1. Subscribe: Tell React how to listen for store changes
    (callback) => {
      gameEngine.events.on("game_update", callback);

      // Clean up listeners when the component unmounts
      return () => {
        gameEngine.events.off("game_update", callback);
      };
    },
    // 2. Get Snapshot: Tell React how to read the specific slice of data
    () => selector(gameEngine),
  );
}
