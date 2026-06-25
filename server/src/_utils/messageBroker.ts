import type { WebSocket } from "ws";

let sockets: Map<number, WebSocket> = new Map();

export function registerConnections(connections: Map<number, WebSocket>): void {
  sockets = connections;
}

export function send(playerId: number, data: any): void {
  const socket = sockets.get(playerId);
  if (socket?.readyState !== 1) return;

  socket.send(JSON.stringify(data));
}
