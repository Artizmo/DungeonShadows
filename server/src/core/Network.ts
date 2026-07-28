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
  readonly events = new EventEmitter();
  readonly socketServer: WebSocketServer;
  readonly connections = new Map<number, WebSocket>();
  readonly broadcast = new Broadcaster(this.connections);

  packetQueue: QueueItem[] = [];
  private getTick: () => number = () => 0;
  private pingInterval: NodeJS.Timeout;

  constructor(config: { port: number }) {
    this.socketServer = new WebSocketServer({ port: config.port });

    // Keep-alive heartbeat loop
    this.pingInterval = setInterval(() => {
      for (const [id, socket] of this.connections.entries()) {
        if (socket.readyState === WebSocket.OPEN) {
          if (!socket.isAlive) {
            Log.NETWORK.WARN(`Player ${id} timed out.`);
            socket.terminate(); // Triggers "close" event cleanly
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

      // 1. Guard: Validate Origin
      if (isProd && origin && origin !== process.env.ALLOWED_ORIGIN) {
        Log.NETWORK.WARN(`Blocked unauthorized connection from: ${origin}`);
        socket.close(4003, "Forbidden Origin");
        return;
      }

      // 2. Parse URL and Extract Ticket
      const base = origin || "http://localhost";
      const parsedUrl = new URL(request.url || "", base);
      const ticket = parsedUrl.searchParams.get("ticket");

      // 3. Guard: Validate Ticket Presence
      if (!ticket || ticket === "undefined" || ticket === "[object Object]") {
        Log.NETWORK.WARN(
          `Connection rejected: Malformed ticket. Received: "${ticket}"`
        );
        socket.close(4001, "Unauthorized: Ticket Missing");
        return;
      }

      // 4. Extract Camera Dimensions from Subprotocol
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

      // 5. Authenticate JWT Ticket
      const secretKey =
        process.env.GAME_SECRET || "fallback_secret_key_development_only";

      try {
        const decoded = jwt.verify(ticket, secretKey) as {
          playerId: unknown;
          characterId: unknown;
        };
        const playerId = Number(decoded.playerId);
        const characterId = Number(decoded.characterId);

        // 6. Evict Existing Stale Connections
        const staleSocket = this.connections.get(characterId);
        if (staleSocket) {
          // Temporarily remove listener to prevent the old socket's close event
          // from deleting the Map key we are about to overwrite.
          staleSocket.removeAllListeners("close");
          staleSocket.close(4000, "Evicted by new session handshake");
        }

        // 7. Register and Initialize New Session
        socket.isAlive = true;
        this.connections.set(characterId, socket);

        this.events.emit("new_connection", {
          characterId,
          playerId,
          camera: { width, height },
        });

        socket.on("pong", () => {
          socket.isAlive = true;
          Log.NETWORK.INFO(`Received PONG from characterId ${characterId}`);
        });

        socket.on("message", (message, isBinary) => {
          try {
            if (!message || !isBinary) return;

            const bytes = new Uint8Array(message as Buffer);
            this.packetQueue.push({
              tick: this.getTick(),
              bytes,
            });
          } catch (err) {
            Log.NETWORK.ERROR(`Failed to handle incoming packet: ${err}`);
          }
        });

        socket.on("close", () => {
          this.handleSocketClose(characterId, socket);
        });

        socket.on("error", (error) => {
          Log.NETWORK.ERROR(
            `Socket error for CID ${characterId}: ${error.message}`
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

  private handleSocketClose(
    characterId: number,
    closingSocket: WebSocket
  ): void {
    if (this.connections.get(characterId) === closingSocket) {
      this.connections.delete(characterId);
      this.events.emit("connection_closed", { characterId });
    }
  }

  public close(): void {
    clearInterval(this.pingInterval);
    this.socketServer.close();
  }
}
