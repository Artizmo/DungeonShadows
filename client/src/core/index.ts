import Game from "~/core/Game";
import type { Config } from "~/@types/game";

const loopConfig: Config = {
  cycleRate: 0.016666667, // Now matching 60Hz processing chunks
  tickRate: 0.05, // Sync window updates every 50ms (20 network updates a sec)
  cycleSize: 600, // Unified reset index timeline maximum boundary
};

// Instantiate the single monolithic game controller context for the UI layer
const gameEngine = new Game(loopConfig);

export default gameEngine;
