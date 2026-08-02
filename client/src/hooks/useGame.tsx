// ~/hooks/useGame.ts
import { useSyncExternalStore, useCallback, useRef } from "react";
import gameEngine from "~/core";
import type Game from "~/core/Game";

export function useGame<T>(selector: (game: Game) => T): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const subscribe = useCallback((callback: () => void) => {
    const handleUpdate = () => callback();
    gameEngine.events.on("game_update", handleUpdate);
    return () => {
      gameEngine.events.off("game_update", handleUpdate);
    };
  }, []);

  // 🟢 Pure snapshot getter without cached ref pollution
  const getSnapshot = useCallback(() => {
    return selectorRef.current(gameEngine);
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot);
}
