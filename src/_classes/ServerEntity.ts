import { ServerType } from "../_types/server"

export default class ServerEntity {
  server: ServerType

  constructor(server: ServerType) {
    this.server = server
  }

  update(pulse: boolean) {

  }

  draw() {

  }
}