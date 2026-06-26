import { useEffect, useState, useCallback } from "react";
import {
  createFileRoute,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import gameEngine from "~/core";
import GameHud from "~/components/game/GameHud";
import GameCanvas from "~/components/game/GameCanvas";
import { fetchGameTicket } from "~/services/auth";

export const Route = createFileRoute("/game/")({
  component: GameComponent,
});

function GameComponent() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const stateRecord = state as Record<string, any>;
  const characterId = Number(stateRecord?.characterId) || 0;
  const playerId = Number(stateRecord?.playerId) || 0;

  const [isReady, setIsReady] = useState(false);

  // Wrapped engine resize handler passed cleanly downstream
  const handleEngineResize = useCallback((canvas: HTMLCanvasElement) => {
    gameEngine.bindCanvas(canvas);
  }, []);

  // Structural Core Connection - Fires exactly ONCE
  useEffect(() => {
    let isAborted = false;

    if (!characterId || !playerId) {
      navigate({ to: "/login" });
      return;
    }

    const bootSequence = async () => {
      console.log("🔌 Initializing secure socket connection process...");
      const ticket = await fetchGameTicket(characterId, playerId);

      if (isAborted) return;
      if (!ticket) {
        navigate({ to: "/login" });
        return;
      }

      console.log(
        "🎯 Valid token acquired. Igniting engine core logic streams.",
      );

      // Start connection, clocks, and internal game structures without a canvas
      await gameEngine.start(ticket);
      gameEngine.events.emit("CHARACTER_UPDATED");

      if (!isAborted) {
        setIsReady(true);
      }
    };

    bootSequence();

    return () => {
      isAborted = true;
      setIsReady(false);
      console.log("🛑 Shutting down engine instance...");
      gameEngine.shutdown();
    };
  }, [characterId, playerId, navigate]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none z-0 rpg-cursor-zone">
      <GameCanvas isReady={isReady} onResize={handleEngineResize} />
      <GameHud />
    </div>
  );
}
