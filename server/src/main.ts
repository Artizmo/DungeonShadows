import { Config } from "~/types/system";
import { CONFIG_PATH } from "~/utils/constants";
import getLocalFile from "~/utils/functions/getLocalFile";
import Game from "~/core/Game";
import Log from "~/shared/core/Logger";

process.stdout.write("\x1b]0;⚔️ DS Game Server\x07");

async function init() {
  const config = await getLocalFile<Config>(CONFIG_PATH);
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
