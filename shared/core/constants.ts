import type { GameConfig } from "./types.js";

export const FPS = 60;
export const CHUNK_SIZE = 256;

export const LoopConfig: GameConfig = {
  speed: 200,
  tickRate: 1000 / 20, // 20Hz
  frameRate: 1000 / FPS, // 60Hz fixed
  frameSize: 600,
  interpolationDelay: 100,
};

// Bitmask Flags
export const FLAG_NONE = 0; // 0000 0000 - None
export const FLAG_ACTIVE = 1 << 0; // 0000 0001 - Entity is in character's AOI
export const FLAG_DIRTY = 1 << 1; // 0000 0010 - Game will send snapshot of deltas
export const FLAG_SPAWNED = 1 << 2; // 0000 0100 - Loading into game
export const FLAG_POSITION = 1 << 3; // 0000 1000 - Position has changed
export const FLAG_DESPAWN = 1 << 4; // 0001 0000 - Unloading from game

export const MAX_ENTITIES = 128_000;
