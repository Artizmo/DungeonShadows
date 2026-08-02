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

// 1. Pre-allocated packet slot structure to avoid inline object literal creation
export interface PacketSlot {
  tick: number;
  buffer: Buffer | null;
}

const MAX_QUEUE_SIZE = 10000; // Upper capacity bound for raw packets per frame

export default class Network {
  readonly events = new EventEmitter();
  readonly socketServer: WebSocketServer;
  readonly connections = new Map<number, WebSocket>();
  readonly broadcast = new Broadcaster(this.connections);

  // 2. Pre-allocated packet queue pool (Zero GC during game tick)
  public packetQueue: PacketSlot[] = new Array(MAX_QUEUE_SIZE);
  public packetCount = 0;

  private getTick: () => number = () => 0;
  private pingInterval: NodeJS.Timeout;

  constructor(config: { port: number }) {
    // Instantiate slot objects ONCE during boot
    for (let i = 0; i < MAX_QUEUE_SIZE; i++) {
      this.packetQueue[i] = { tick: 0, buffer: null };
    }

    this.socketServer = new WebSocketServer({ port: config.port });

    // Keep-alive heartbeat loop
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
          staleSocket.removeAllListeners("close");
          staleSocket.close(4000, "Evicted by new session handshake");
        }

        // 7. Register and Initialize New Session
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

        // 🟢 ZERO-GC MESSAGE LISTENER
        socket.on("message", (message: Buffer, isBinary: boolean) => {
          if (!isBinary || !message) return;

          // Prevent queue overflow under heavy attack/load
          if (this.packetCount >= MAX_QUEUE_SIZE) return;

          // Mutate existing pre-allocated slot instance (NO NEW OBJECTS CREATED)
          const slot = this.packetQueue[this.packetCount++];
          slot.tick = this.getTick();
          slot.buffer = message; // Direct reference to ws Buffer
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

  // 🟢 ZERO-ALLOCATION QUEUE FLUSH (Call this at the end of World.tick())
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
      this.events.emit("disconnect", { characterId });
    }
  }

  public close(): void {
    clearInterval(this.pingInterval);
    this.socketServer.close();
  }
}
