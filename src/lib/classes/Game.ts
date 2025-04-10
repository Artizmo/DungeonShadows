import { SavedWorld } from "../types/world";
import { GameEvents } from "../types/game";
import GameServer from "./GameServer";
import GameLoop from "./GameLoop";
import World from "./World";

export default class Game {
  gameEvents: GameEvents;
  gameServer: GameServer;
  gameLoop: GameLoop;
  world: World;
  
  constructor(gameLoop: GameLoop, gameServer: GameServer, gameEvents: GameEvents) {
    this.gameEvents = gameEvents;
    this.gameServer = gameServer;
    this.gameLoop = gameLoop;
    this.gameLoop.tick = data => this.tick(data);
    this.gameLoop.update = () => this.update();
  }

  start() {
    const savedWorld: SavedWorld = { name: "Dragon Shadows", areas: new Map() };
    this.world = new World(savedWorld, this.gameServer, this.gameEvents);
  }

  tick(cycle: any) {
    console.log('bingo tick', cycle)
  }

  update() {
    this.world.update();
  }
}