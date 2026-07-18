import { useSyncExternalStore, useCallback } from "react";
import gameEngine from "~/core";
import type Game from "~/core/Game";

export function useGame<T>(selector: (game: Game) => T): T {
  const subscribe = useCallback((callback: () => void) => {
    gameEngine.events.on("game_update", callback);
    return () => {
      gameEngine.events.off("game_update", callback);
    };
  }, []);

  return useSyncExternalStore(subscribe, () => selector(gameEngine));
}
