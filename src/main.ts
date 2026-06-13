import { Config } from "~/types/system";
import type { SavedWorld } from "~/types/world";
import { CONFIG_PATH } from "~/utils/constants";
import getLocalFile from "~/utils/functions/getLocalFile";
import Game from "~/core/Game";
import Log from "~/core/Logger";

async function init() {
  const config = await getLocalFile<Config>(CONFIG_PATH);
  Log.SYSTEM.INFO(`${config.name} is starting up...`);
  try {
    const game = new Game(config);
    const savedWorld = await getLocalFile<SavedWorld>(config.savedWorldPath);
    game.start(savedWorld);
    Log.SYSTEM.INFO(`${config.name} is online!`);
  } catch (error) {
    Log.SYSTEM.ERROR(`Game failed to initialize: ${error}`);
  }
}

init();