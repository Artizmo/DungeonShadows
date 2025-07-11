import { SavedWorld } from "../types/world";
import { Config } from "../types/system";
import GameLoop from "./GameLoop";
import GameServer from "./GameServer";
import GameEngine from "./GameEngine";
import World from "./World";

export default class Game {
  gameLoop: GameLoop;
  gameServer: GameServer;
  gameEngine: GameEngine;
  world: World;

  constructor(config: Config) {
    this.gameServer = new GameServer(config, data => this.input(data));
    this.gameLoop = new GameLoop(config, cycle => this.tick(cycle), () => this.update());
    this.gameEngine = new GameEngine(this.gameLoop, this.gameServer);
  }

  start(savedWorld: SavedWorld) {
    this.world = new World(savedWorld, this.gameEngine);
    console.log(`Game is started! :)`);
  }

  tick(cycle: number) {
    if (this.world) {
      this.world.tick(cycle);
    }
  }

  update() {
    if (this.world) {
      this.world.update();
    }
  }

  input(data: any) {
    if (this.world) {
      this.world.input(data);
    }
  }
}