import type { IConnection } from "~/core/game/types";

export class WebSocketConnection implements IConnection {
  constructor(private ws: any) {} // Your raw ws instance

  public send(data: Uint8Array) {
    if (this.ws.readyState === 1) {
      // OPEN
      this.ws.send(data, { binary: true });
    }
  }

  public disconnect() {
    this.ws.close();
  }
}
