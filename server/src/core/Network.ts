import EventEmitter from "events";
import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Log } from "~/shared/core/Logger";
import Broadcaster from "./Broadcaster";

dotenv.config();

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
  }
}

export interface PacketSlot {
  tick: number;
  buffer: Buffer | null;
}

const MAX_QUEUE_SIZE = 10000;

export default class Network {
  readonly events = new EventEmitter();
  readonly socketServer: WebSocketServer;
  readonly connections = new Map<number, WebSocket>();
  readonly broadcast = new Broadcaster(this.connections);

  public packetQueue: PacketSlot[] = new Array(MAX_QUEUE_SIZE);
  public packetCount = 0;

  private getTick: () => number = () => 0;
  private pingInterval: NodeJS.Timeout;

  constructor(config: { port: number }) {
    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      this.packetQueue[i] = { tick: 0, buffer: null };
    }

    this.socketServer = new WebSocketServer({ port: config.port });

    // Keep-alive ping loop for detecting silent network drops/timeouts
    this.pingInterval = setInterval(() => {
      for (const [id, socket] of this.connections.entries()) {
        if (socket.readyState === WebSocket.OPEN) {
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
      const isProd = process.env.NODE_ENV === "production";

      if (isProd && origin && origin !== process.env.ALLOWED_ORIGIN) {
        Log.NETWORK.WARN(`Blocked unauthorized connection from: ${origin}`);
        socket.close(4003, "Forbidden Origin");
        return;
      }

      const base = origin || "http://localhost";
      const parsedUrl = new URL(request.url || "", base);
      const ticket = parsedUrl.searchParams.get("ticket");

      if (!ticket || ticket === "undefined" || ticket === "[object Object]") {
        Log.NETWORK.WARN(
          `Connection rejected: Malformed ticket. Received: "${ticket}"`
        );
        socket.close(4001, "Unauthorized: Ticket Missing");
        return;
      }

      let width = 0,
        height = 0;
      const protocol = request.headers["sec-websocket-protocol"];

      if (protocol?.startsWith("dimensions-")) {
        const [w, h] = protocol
          .replace("dimensions-", "")
          .split("x")
          .map(Number);
        width = w || 0;
        height = h || 0;
      }

      const secretKey =
        process.env.GAME_SECRET || "fallback_secret_key_development_only";

      try {
        const decoded = jwt.verify(ticket, secretKey) as {
          playerId: unknown;
          characterId: unknown;
        };
        const playerId = Number(decoded.playerId);
        const characterId = Number(decoded.characterId);

        // Evict duplicate existing connections
        const staleSocket = this.connections.get(characterId);
        if (staleSocket) {
          staleSocket.removeAllListeners("close");
          staleSocket.close(4000, "Evicted by new session handshake");
        }

        socket.isAlive = true;
        this.connections.set(characterId, socket);

        this.events.emit("connect", {
          characterId,
          playerId,
          camera: { width, height },
        });

        socket.on("pong", () => {
          socket.isAlive = true;
        });

        socket.on("message", (message: Buffer, isBinary: boolean) => {
          if (!isBinary || !message) return;
          if (this.packetCount >= MAX_QUEUE_SIZE) return;

          const slot = this.packetQueue[this.packetCount++];
          slot.tick = this.getTick();
          slot.buffer = message;
        });

        socket.on("close", () => {
          this.handleSocketClose(characterId, socket);
          Log.NETWORK.WARN(`Socket closed for character (${characterId})!`);
        });

        socket.on("error", (error) => {
          this.handleSocketClose(characterId, socket);
          Log.NETWORK.ERROR(
            `Socket error for character (${characterId}): ${error.message}`
          );
        });
      } catch (err) {
        socket.send(
          JSON.stringify({
            type: "INVALID_JWT",
            data: "You do not have a valid ticket.",
          })
        );
        Log.NETWORK.WARN(
          `Connection rejected: Invalid ticket signature. ${err}`
        );
        socket.close(4001, "Unauthorized: Invalid Ticket");
      }
    });

    Log.NETWORK.INFO(`Server listening on port ${config.port}.`);
  }

  public registerTickProvider(callback: () => number): void {
    this.getTick = callback;
  }

  public clearPacketQueue(): void {
    for (let i = 0; i < this.packetCount; i++) {
      this.packetQueue[i].buffer = null;
    }
    this.packetCount = 0;
  }

  private handleSocketClose(
    characterId: number,
    closingSocket: WebSocket
  ): void {
    if (this.connections.get(characterId) === closingSocket) {
      this.connections.delete(characterId);
      // Emits to your Game Engine to remove character from active world
      this.events.emit("disconnect", { characterId });
    }
  }

  public close(): void {
    clearInterval(this.pingInterval);
    this.socketServer.close();
  }
}
