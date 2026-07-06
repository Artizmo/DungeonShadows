import type {
  NetworkEnvelope,
  ServerTransport,
  Snapshot,
} from "~/shared/core/types";

export default class Network {
  public actionQueue: NetworkEnvelope[] = [];

  constructor(private transport: ServerTransport) {
    this.transport.onReceive((connectionId, packet) => {
      this.actionQueue.push({ connectionId, packet });
    });
  }

  broadcast(snapshot: Snapshot): void {
    this.transport.broadcast(snapshot);
  }
}
