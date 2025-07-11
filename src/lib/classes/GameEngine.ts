import type GameServer from "./GameServer";
import type GameLoop from "./GameLoop";

export default class GameEngine {
  gameLoop: GameLoop;
  gameServer: GameServer;

  constructor(gameLoop: GameLoop, gameServer: GameServer) {
    this.gameLoop = gameLoop;
    this.gameServer = gameServer;
  }
}