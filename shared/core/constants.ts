import type { GameConfig } from "./types.js";

const FPS = 60;

export const LoopConfig: GameConfig = {
  speed: 200,
  tickRate: 1000 / 20, // 20Hz
  frameRate: 1000 / FPS, // 60Hz fixed
  frameSize: 600,
  interpolationDelay: 100,
};
