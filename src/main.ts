import { Config } from "./lib/types/system";
import type { SavedWorld } from "./lib/types/world";
import { CONFIG_PATH } from "./utils/constants";
import Game from "./lib/classes/Game";
import getLocalFile from "./utils/functions/getLocalFile";

function init(config: Config) {
  console.log(`${config.name} is initializing...`);
  try {
    const game = new Game(config);
    getLocalFile(config.savedWorldPath, (savedWorld: SavedWorld) => game.start(savedWorld));
  } catch (error) {
    console.log(`Game failed to initialize: ${error}`);
  }
}

getLocalFile(CONFIG_PATH, init);