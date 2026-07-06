import type Game from "~/core/Game";
import type { ActionRecord, ClientTransport } from "~/shared/core/types";

export default class Network {
  constructor(
    private game: Game,
    private transport: ClientTransport,
  ) {
    this.transport.onReceive((snapshot) => {
      this.game.onNetworkReceive(snapshot);
    });
  }
  send(packet: ActionRecord): void {
    this.transport.send(packet);
  }
}
