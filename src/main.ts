import fs from "fs";
import { Config } from "./lib/types/system";
import { CONFIG_PATH } from "./utils/constants";
import Game from "./lib/classes/Game";
import GameServer from "./lib/classes/GameServer";
import GameEvents from "./lib/classes/GameEvents";
import GameLoop from "./lib/classes/GameLoop";

/**
 * LOAD GAME RESOURCES
 * -config.JSON
 */

fs.readFile(CONFIG_PATH, (err, data) => {
  if (err) console.log(`Could not read from path: ${CONFIG_PATH}. Error: ${err}`);
    
  try {
    const config: Config = JSON.parse(data.toString());
    init(config);
  } catch (error) {
    console.log(`Game failed to fetch config data: ${error}`);
  }
});

function init(config: Config) {
  try {
    const gameEvents = new GameEvents();
    const gameServer = new GameServer(config.port, gameEvents);
    const gameLoop = new GameLoop(config, gameEvents);
    const game = new Game(gameLoop, gameServer, gameEvents);
    game.start();

  } catch (error) {
    console.log(`Game failed to initialize: ${error}`);
  }
}