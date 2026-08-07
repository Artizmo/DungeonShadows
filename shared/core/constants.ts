import type { GameConfig } from "./types.js";

// Core
export const FPS = 60;
export const SHARED_ROOT_PATH = "../shared/data/world/areas";
export const LoopConfig: GameConfig = {
  speed: 200,
  tickRate: 1000 / 20, // 20Hz
  frameRate: 1000 / FPS, // 60Hz fixed
  frameSize: 600,
  interpolationDelay: 100,
};

// Zone constants
export const CHUNK_SIZE = 256;
export const MAX_BUCKETS = 64;
export const MAX_ENTITIES_PER_BUCKET = 1024;
export const MAX_ENTITIES = 10_000;
export const MAX_ITEMS = 10_000;
export const MAX_STRUCTURES = 10_000;
export const MAX_CHARACTERS = 1000;
