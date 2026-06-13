import { Config } from "~/types/system";
import type { SavedWorld } from "~/types/world";
import { CONFIG_PATH } from "~/utils/constants";
import getLocalFile from "~/utils/functions/getLocalFile";
import Game from "~/core/Game";
import Logger from "~/core/Logger";

const logger = new Logger("SYSTEM");

async function init() {
  const config = await getLocalFile<Config>(CONFIG_PATH);
  logger.info(`${config.name} is starting up...`);
  try {
    const game = new Game(config);
    const savedWorld = await getLocalFile<SavedWorld>(config.savedWorldPath);
    game.start(savedWorld);
    logger.info(`${config.name} is online!`);
  } catch (error) {
    logger.error(`Game failed to initialize: ${error}`);
  }
}

init();