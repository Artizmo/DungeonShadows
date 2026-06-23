import { useEffect, useRef, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import gameEngine from "~/core";
import GameHud from "./components/GameHud";
import { fetchGameTicket } from "~/services/auth";

export const Route = createFileRoute("/game/")({
  component: GameComponent,
});

export default Route;

function GameComponent() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useLocation();
  const stateRecord = state as Record<string, any>;
  const characterId = Number(stateRecord?.characterId) || 0;
  const playerId = Number(stateRecord?.playerId) || 0;

  // 1. Introduce an engine key. Changing this forces a hard reset of the canvas and engine.
  const [engineKey, setEngineKey] = useState(0);

  // Boot sequence effect - tied directly to engineKey
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
      const canvasElement = canvasRef.current;
      if (!canvasElement) return;

      console.log("🎯 Valid token acquired. Igniting engine core.");

      // Setup window dimensions exactly before engine mounts
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;

      gameEngine.start(canvasElement, ticket);
    };

    bootSequence();

    return () => {
      isAborted = true;
      console.log("🛑 Shutting down engine instance...");
      gameEngine.shutdown();
    };
  }, [characterId, playerId, navigate, engineKey]); // <-- Triggers re-boot when engineKey changes

  // 2. Watch for drastic DevTools resizing layout shifts
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      // Clear previous timeout while user is actively dragging/opening DevTools
      clearTimeout(resizeTimeout);

      // Wait 150ms after resizing stops, then force-reboot the engine
      resizeTimeout = setTimeout(() => {
        console.log("♻️ DevTools shift detected. Forcing engine hot-reload...");
        setEngineKey((prev) => prev + 1);
      }, 150);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black select-none z-0">
      {/* 3. Passing engineKey here ensures React destroys and re-creates the canvas DOM element cleanly */}
      <canvas
        key={engineKey}
        ref={canvasRef}
        id="game-canvas"
        className="block w-full h-full pointer-events-auto"
      />
      <GameHud playerId={playerId} characterId={characterId} />
    </div>
  );
}
