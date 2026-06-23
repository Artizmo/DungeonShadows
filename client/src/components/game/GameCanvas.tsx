import { useEffect, useRef } from "react";
import gameEngine from "~/core";

interface GameCanvasProps {
  isReady: boolean;
  onResize: (canvas: HTMLCanvasElement) => void;
}

export default function GameCanvas({ isReady, onResize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bind the canvas to the engine immediately once the engine's core is ready
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement || !isReady) return;

    // Set initial canvas backbuffer size to fill window pixel space
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    console.log(
      "🎨 Canvas DOM ready. Binding to game engine graphics pipeline.",
    );

    // Hand the DOM element off to our new engine method safely
    gameEngine.bindCanvas(canvasElement);

    // Notify parent resize handler of initial dimensions
    onResize(canvasElement);
  }, [isReady, onResize]);

  // Handle subsequent window resizes smoothly without dropped connections
  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        // Mutate drawing resolution instantly
        canvasElement.width = width;
        canvasElement.height = height;

        // Bubble up the callback to resize the engine's projection viewport
        onResize(canvasElement);
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [onResize]);

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      className="block w-full h-full pointer-events-auto"
    />
  );
}
