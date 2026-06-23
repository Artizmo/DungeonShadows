// ~/hooks/useGame.ts
import { useState, useEffect, useRef } from "react";
import gameEngine from "~/core";
import type Game from "~/core/Game";

/**
 * A selective hook that only triggers a re-render if the chosen
 * data slice extracted from the game engine changes.
 */
export function useGame<T>(selector: (game: Game) => T): T {
  // 1. Run the selector initially to get the starting state slice
  const [slice, setSlice] = useState<T>(() => selector(gameEngine));

  // Keep a mutable reference to the selector and current slice to avoid stale closure issues
  const selectorRef = useRef(selector);
  const currentSliceRef = useRef(slice);

  useEffect(() => {
    selectorRef.current = selector;
    currentSliceRef.current = slice;
  });

  useEffect(() => {
    const handleEngineUpdate = () => {
      try {
        // 2. Extract the fresh data slice using the selector
        const nextSlice = selectorRef.current(gameEngine);

        // 3. Structural Comparison: Only update React state if the data actually changed
        // Works flawlessly for primitive numbers, strings, or flat objects/arrays
        if (
          JSON.stringify(currentSliceRef.current) !== JSON.stringify(nextSlice)
        ) {
          setSlice(nextSlice);
        }
      } catch (err) {
        console.error("Error evaluating useGame selector slice:", err);
      }
    };

    // 4. Listen to the engine's physics and networking update events
    const unsubscribeCharacter = gameEngine.subscribe(
      "CHARACTER_UPDATED",
      handleEngineUpdate,
    );
    const unsubscribeWorld = gameEngine.subscribe(
      "WORLD_UPDATED",
      handleEngineUpdate,
    );

    // Initial check in case data populated between mount cycles
    handleEngineUpdate();

    return () => {
      unsubscribeCharacter();
      unsubscribeWorld();
    };
  }, []);

  return slice;
}
