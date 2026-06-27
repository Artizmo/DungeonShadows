import { useEffect, useRef } from "react";

interface GameCanvasProps {
  onResize: (canvas: HTMLCanvasElement) => void;
}

export default function GameCanvas({ onResize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 1. Initial Setup Loop (Runs once when ready)
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    // Set initial canvas backbuffer size to fill window pixel space
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;

    console.log("🎨 Game canvas is ready!");

    // Bubble up to the route controller. Let the parent handle the bind!
    onResize(canvasElement);
  }, [onResize]);

  // 2. Continuous Resize Listener Loop
  useEffect(() => {
    let resizeTimeout: number;

    const handleResize = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        const canvasElement = canvasRef.current;
        if (!canvasElement) return;

        canvasElement.width = window.innerWidth;
        canvasElement.height = window.innerHeight;

        // Bubble up the new dimensions to update the engine projection matrix
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
