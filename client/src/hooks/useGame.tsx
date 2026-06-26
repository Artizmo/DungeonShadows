import { useSyncExternalStore } from "react";
import gameEngine from "~/core";
import type Game from "~/core/game/Game";

export function useGame<T>(selector: (game: Game) => T): T {
  return useSyncExternalStore(
    // 1. Subscribe: Tell React how to listen for store changes
    (callback) => {
      gameEngine.events.on("CHARACTER_UPDATE", callback);
      gameEngine.events.on("WORLD_UPDATE", callback);

      // Clean up listeners when the component unmounts
      return () => {
        gameEngine.events.off("CHARACTER_UPDATE", callback);
        gameEngine.events.off("WORLD_UPDATE", callback);
      };
    },
    // 2. Get Snapshot: Tell React how to read the specific slice of data
    () => selector(gameEngine),
  );
}
