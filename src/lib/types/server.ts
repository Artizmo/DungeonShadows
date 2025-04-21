import type { WebSocket } from "ws";
import type { IncomingMessage } from "http";

type ServerMessage<T> = {
  type: string
  data: T
};

export type RequestHandlers = Map<string, (arg: any) => void>;

export type Request<T> = { 
  message: ServerMessage<T>
  connection?: WebSocket
  request?: IncomingMessage
};

export type PingTimes = {
  serverTime?: number
  clientTime?: number
  serverAckTime?: number
  clientAckTime?: number
};

export type SavedPlayer = {
  pid: number
  email: string
  firstName: string
  lastName: string
};

export type CharacterSelection = {
  pid?: number
  cid?: number
};