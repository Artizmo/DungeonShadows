import { WebSocketServer, WebSocket } from "ws";
import dotenv from "dotenv";
import { EventEmitter } from "events";
import jwt from "jsonwebtoken";
import { Log } from "~/shared/core/Logger";
import type { Config } from "~/core/game/@types";
import type { NetworkMessage } from "~/core/game/@types";
import type Game from "~/core/game/Game";
import { WebSocketConnection } from "~/_utils/messageBroker";

dotenv.config();

export default class Server {
  public events: EventEmitter = new EventEmitter();
  public readonly socketServer: WebSocketServer;
  public readonly connections: Map<number, WebSocket> = new Map();
  public readonly game: Game;

  constructor(config: Config) {
    this.socketServer = new WebSocketServer({ port: config.port });

    setInterval(() => {
      for (const [id, socket] of this.connections.entries()) {
        if (socket && socket.readyState === WebSocket.OPEN) {
          if (!socket.isAlive) {
            Log.SERVER.WARN(`Player ${id} timed out.`);
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
          Log.SERVER.WARN(`Blocked unauthorized connection from: ${origin}`);
          socket.close(4003, "Forbidden Origin");
          return;
        }
      }

      if (!ticket || ticket === "undefined" || ticket === "[object Object]") {
        Log.SERVER.WARN(
          `Connection rejected: Malformed ticket. Received: "${ticket}"`,
        );
        socket.close(4001, "Unauthorized: Ticket Missing");
        return;
      }

      let formatedPlayerId: number;
      let formatedCharacterId: number;
      const secretKey =
        process.env.GAME_SECRET || "fallback_secret_key_development_only";

      try {
        const decoded = jwt.verify(ticket, secretKey) as {
          playerId: number;
          characterId: number;
        };

        formatedPlayerId = Number(decoded.playerId);
        formatedCharacterId = Number(decoded.characterId);
      } catch (err) {
        socket.send(
          JSON.stringify({
            type: "INVALID_JWT",
            data: "You do not have a valid ticket.",
          }),
        );
        Log.SERVER.WARN(
          `Connection rejected: Invalid ticket signature. ${err}`,
        );
        socket.close(4001, "Unauthorized: Invalid Ticket");
        return;
      }

      if (this.connections.has(formatedPlayerId)) {
        const staleSocket = this.connections.get(formatedPlayerId);
        if (staleSocket && staleSocket !== socket) {
          staleSocket.onclose = null;
          staleSocket.onerror = null;
          staleSocket.close(4000, "Evicted by new session handshake");
        }
      }

      socket.isAlive = true;
      this.connections.set(formatedPlayerId, socket);
      const connection = new WebSocketConnection(socket);

      this.events.emit("player_join", {
        characterId: formatedCharacterId,
        playerId: formatedPlayerId,
        connection,
      });

      socket.on("pong", () => {
        socket.isAlive = true;
        Log.SERVER.INFO(`Received PONG from PID ${formatedPlayerId}`);
      });

      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) return;
          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, formatedPlayerId);
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", (e) => {
        this.handleSocketClose(formatedPlayerId, socket);
      });

      socket.on("error", (error) =>
        Log.SERVER.ERROR(
          `Socket error for PID ${formatedPlayerId}: ${error.message}`,
        ),
      );
    });

    Log.SERVER.INFO(`Server listening on port ${config.port}.`);
  }

  private handleSocketMessage(message: NetworkMessage, playerId: number): void {
    this.events.emit("route_requests", { request: message, playerId });
  }

  private handleSocketClose(playerId: number, closingSocket: WebSocket): void {
    if (this.connections.get(playerId) === closingSocket) {
      this.events.emit("player_disconnect", playerId);
      this.connections.delete(playerId);
    }
  }

  public close(): void {
    this.socketServer.close();
  }
}
