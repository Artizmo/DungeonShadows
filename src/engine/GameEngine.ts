import GameServer from './GameServer'
import GameLoop from './GameLoop'
import { EngineConfig } from './_types/engine-config'

export default class GameEngine {
  private loop: GameLoop
  private server: GameServer
  
  constructor(config: EngineConfig) {
    this.server = new GameServer(config)
    this.loop = new GameLoop()

    this.init()
  }

  init() {
    // start game server
    this.server.start()

    // init resource managers
  }

  start() {
    // run game loop
    this.loop.start()
  }
}