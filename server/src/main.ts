import { Log } from "~/shared/core/Logger";
import Game from "~/core/Game";
import Loop from "~/core/Loop";
import Network from "~/core/Network";
import World from "~/core/World";
import StateManager from "~/core/StateManager";
import config from "~/shared/data/config.json";

process.stdout.write("\x1b]0;⚔️ DS Game Server\x07");

async function init() {
  Log.SYSTEM.INFO(`${config.name} is starting up...`);
  try {
    const loop = new Loop();
    const network = new Network(config);
    const world = new World();
    world.initialize(config.worldPath);
    const stateManager = new StateManager();
    const game = new Game(loop, network, world, stateManager);
    game.start();
    Log.SYSTEM.INFO(`${config.name} is online!`);
  } catch (error) {
    Log.SYSTEM.ERROR(`Game failed to initialize: ${error}`);
  }
}

init();
