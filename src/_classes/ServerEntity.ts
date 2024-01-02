import { GameServerType } from "../_types/game-server"

export default class ServerEntity {
  server: GameServerType

  constructor(server: GameServerType) {
    this.server = server
  }

  update(pulse: boolean) {

  }

  draw() {

  }
}