import GameEvents from "./GameEvents";
import GameServer from "./GameServer";
import GameLoop from "./GameLoop";
import World from "./World";
import { SavedWorld } from "../types/world";
import { Config } from "../types/system";

export default class Game {
  gameEvents: GameEvents = new GameEvents();
  gameServer: GameServer;
  gameLoop: GameLoop;
  world: World;
  
  constructor(config: Config) {
    this.gameServer = new GameServer(config.port, this.gameEvents);
    // this.gameLoop = new GameLoop(config,
    //   () => this.update(),
    //   () => this.tick()
    // )
  }

  start() {
    // const savedWorld: SavedWorld = { name: "", areas: new Map() };
    // this.world = new World(savedWorld, this.gameServer, this.gameEvents);
  }

  // update() {
  //   this.world.update()
  // }

  // tick() {
  //   console.log('bingo tick', this.world.characters.size)
  // }
}