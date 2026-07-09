import EventEmitter from "events";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Log } from "~/shared/core/Logger";
import Broadcaster from "./Broadcaster";
import type { QueueItem } from "~/shared/core/types";

dotenv.config();

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
  }
}

export default class Network {
  readonly socketServer: WebSocketServer;
  readonly connections: Map<number, WebSocket> = new Map();
  events = new EventEmitter();
  broadcast = new Broadcaster(this.connections);
  packetQueue: QueueItem[] = [];
  private getTick: () => number = () => 0;

  constructor(config: any) {
    this.socketServer = new WebSocketServer({ port: config.port });

    setInterval(() => {
      for (const [id, socket] of this.connections.entries()) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          if (!socket.isAlive) {
            Log.NETWORK.WARN(`Player ${id} timed out.`);
            socket.terminate();
            continue;
          }

          socket.isAlive = false;
          socket.ping();
        }
      }
    }, 30000);

    this.socketServer.on("connection", async (socket: WebSocket, request) => {
      const { origin } = request.headers;
      const rawUrl = request.url || "";
      const fullUrlString = rawUrl.startsWith("http")
        ? rawUrl
        : `${origin || "http://localhost"}${rawUrl}`;

      const parsedUrl = new URL(fullUrlString);
      const ticket = parsedUrl.searchParams.get("ticket");

      if (origin !== undefined) {
        const isDevelopment = process.env.NODE_ENV !== "production";
        if (!isDevelopment && origin !== process.env.ALLOWED_ORIGIN) {
          Log.NETWORK.WARN(`Blocked unauthorized connection from: ${origin}`);
          socket.close(4003, "Forbidden Origin");
          return;
        }
      }

      if (!ticket || ticket === "undefined" || ticket === "[object Object]") {
        Log.NETWORK.WARN(
          `Connection rejected: Malformed ticket. Received: "${ticket}"`,
        );
        socket.close(4001, "Unauthorized: Ticket Missing");
        return;
      }

      let playerId: number;
      let characterId: number;
      const secretKey =
        process.env.GAME_SECRET || "fallback_secret_key_development_only";

      try {
        const decoded = jwt.verify(ticket, secretKey) as {
          playerId: number;
          characterId: number;
        };

        playerId = Number(decoded.playerId);
        characterId = Number(decoded.characterId);
      } catch (err) {
        socket.send(
          JSON.stringify({
            type: "INVALID_JWT",
            data: "You do not have a valid ticket.",
          }),
        );
        Log.NETWORK.WARN(
          `Connection rejected: Invalid ticket signature. ${err}`,
        );
        socket.close(4001, "Unauthorized: Invalid Ticket");
        return;
      }

      if (this.connections.has(characterId)) {
        const staleSocket = this.connections.get(characterId);
        if (staleSocket) {
          staleSocket.close(4000, "Evicted by new session handshake");
        }
      }

      socket.isAlive = true;
      this.connections.set(characterId, socket);
      this.events.emit("new_connection", {
        characterId,
        playerId,
      });

      socket.on("pong", () => {
        socket.isAlive = true;
        Log.NETWORK.INFO(`Received PONG from characterId ${characterId}`);
      });

      socket.on("message", (message, isBinary) => {
        try {
          if (!message) return;
          if (!isBinary) return;

          // 🟢 This pulls the raw, clean Uint8Array bytes directly out of the message
          const bytes = new Uint8Array(message as Buffer);
          this.packetQueue.push({
            tick: this.getTick(),
            bytes: bytes,
          });
        } catch (err) {
          Log.NETWORK.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", (e) => {
        this.handleSocketClose(playerId, socket);
      });

      socket.on("error", (error) =>
        Log.NETWORK.ERROR(`Socket error for PID ${playerId}: ${error.message}`),
      );
    });

    Log.NETWORK.INFO(`Server listening on port ${config.port}.`);
  }

  public registerTickProvider(callback: () => number): void {
    this.getTick = callback;
  }

  private handleSocketClose(
    characterId: number,
    closingSocket: WebSocket,
  ): void {
    if (this.connections.get(characterId) === closingSocket) {
      this.connections.delete(characterId);
    }
  }

  public close(): void {
    this.socketServer.close();
  }
}
