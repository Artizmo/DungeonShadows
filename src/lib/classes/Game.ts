import { SavedWorld } from "../types/world";
import { Config } from "../types/system";
import GameEvents from "./GameEvents";
import GameServer from "./GameServer";
import GameLoop from "./GameLoop";
import World from "./World";

export default class Game {
  gameEvents: GameEvents;
  gameServer: GameServer;
  gameLoop: GameLoop;
  world: World;
  
  constructor(config: Config) {    
    this.gameEvents = new GameEvents();
    this.gameServer = new GameServer(config.port, this.gameEvents);
    this.gameServer.input = data => this.input(data);
    this.gameLoop = new GameLoop(config);
    this.gameLoop.tick = () => this.tick();
    this.gameLoop.update = () => this.update();
  }

  start() {
    const savedWorld: SavedWorld = { name: "Dragon Shadows", areas: new Map() };
    this.world = new World(savedWorld, this.gameServer, this.gameEvents);
  }

  tick() {
  }

  update() {
    this.world.update();
  }

  input(data: any) {
    this.world.input(data);
  }
}