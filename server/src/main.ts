import Game from "~/core/game/Game";
import { Log } from "~/shared/core/Logger";
import config from "~/shared/data/config.json";

process.stdout.write("\x1b]0;⚔️ DS Game Server\x07");

async function init() {
  Log.SYSTEM.INFO(`${config.name} is starting up...`);
  try {
    const game = new Game(config);
    game.start(config.worldPath);
    Log.SYSTEM.INFO(`${config.name} is online!`);
  } catch (error) {
    Log.SYSTEM.ERROR(`Game failed to initialize: ${error}`);
  }
}

init();
