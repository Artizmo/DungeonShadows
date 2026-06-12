import { WebSocket } from "ws";

export interface NetworkMessage {
  type: string;
  data?: any;
  socket: WebSocket;
}