import { WebSocket } from "ws";

export default class Broadcaster {
  // Pass a way to look up the active players/connections
  constructor(private connections: Map<number, WebSocket>) {}

  /**
   * Direct message to a single player by their unique ID
   */
  sendTo(characterId: number, packet: Uint8Array): void {
    const connection = this.connections.get(characterId);
    if (connection && connection.readyState === WebSocket.OPEN) {
      connection.send(packet);
    }
  }

  /**
   * Broadcasts a message to absolutely everyone connected to the server
   */
  sendToAll(packet: Uint8Array): void {
    for (const connection of this.connections.values()) {
      if (connection && connection.readyState === WebSocket.OPEN) {
        connection.send(packet);
      }
    }
  }

  /**
   * Broadcasts a message to everyone except one specific player (e.g., local movement echoes)
   */
  sendToAllExcept(excludeId: number, packet: Uint8Array): void {
    for (const [characterId, connection] of this.connections) {
      if (
        characterId !== excludeId &&
        connection.readyState === WebSocket.OPEN
      ) {
        connection.send(packet);
      }
    }
  }

  /**
   * Spatial/Neighbor broadcast based on interest management (AoI).
   * Perfect for delta snapshots or local entity updates.
   */
  sendToNeighbors(
    centerCharacterId: number,
    neighborIds: Iterable<number>,
    packet: Uint8Array,
  ): void {
    for (const neighborId of neighborIds) {
      // Don't send the neighbor message back to the originating actor
      if (neighborId === centerCharacterId) continue;

      const connection = this.connections.get(neighborId);
      if (connection?.readyState === WebSocket.OPEN) {
        connection.send(packet);
      }
    }
  }
}
