import { useEffect, useRef } from "react";

interface GameCanvasProps {
  onResize: (canvas: HTMLCanvasElement) => void;
}

export default function GameCanvas({ onResize }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // 🟢 Store the callback in a ref so changes to it don't re-trigger the useEffect loop
  const onResizeRef = useRef(onResize);
  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    // Direct execution for the exact moment the canvas mounts
    const updateDimensions = () => {
      canvasElement.width = window.innerWidth;
      canvasElement.height = window.innerHeight;
      onResizeRef.current(canvasElement);
    };

    // Debounced execution for when the user is dragging the window borders
    const handleDebouncedResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(updateDimensions, 50);
    };

    console.log("🎨 Game canvas is ready!");

    // 1. Run once immediately on mount
    updateDimensions();

    // 2. Listen for window changes
    window.addEventListener("resize", handleDebouncedResize);

    return () => {
      window.removeEventListener("resize", handleDebouncedResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []); // 🟢 Empty dependency array guarantees this setup runs exactly once on mount

  return (
    <canvas
      ref={canvasRef}
      id="game-canvas"
      className="block w-full h-full pointer-events-auto"
    />
  );
}
