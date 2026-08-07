import { Log } from "~/shared/core/Logger";
import config from "~/shared/data/config.json";
import Game from "~/core/Game";
import Loop from "~/core/Loop";
import Network from "~/core/Network";
import World from "~/core/World";

process.stdout.write("\x1b]0;⚔️ DS Game Server\x07");

// 🟢 Main instantiates core game classes
async function init() {
  const { worldPath } = config;
  Log.SYSTEM.INFO(`${config.name} is starting up...`);

  try {
    const loop = new Loop();
    const network = new Network(config);
    const world = new World();
    await world.load(worldPath);
    const game = new Game(loop, network, world);
    game.start();

    Log.SYSTEM.INFO(`${config.name} is online!`);
  } catch (error) {
    Log.SYSTEM.ERROR(`Game failed to initialize: ${error}`);
    process.exit(1);
  }
}

init();
