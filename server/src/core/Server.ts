import dotenv from "dotenv";
import path from "path";
import jwt from "jsonwebtoken";
import { WebSocketServer, WebSocket } from "ws";
import { Log } from "~/shared/core/Logger";
import { EventEmitter } from "events";
import type { Config } from "~/@types/system";
import type { NetworkMessage } from "~/@types/server";
import type Game from "~/core/Game";
import Player from "~/core/Player";
import { registerConnections } from "~/utils/messageBroker";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

declare module "ws" {
  interface WebSocket {
    isAlive: boolean;
  }
}

export default class Server {
  public events: EventEmitter = new EventEmitter();
  public readonly socketServer: WebSocketServer;
  public readonly connections: Map<number, WebSocket> = new Map();
  public readonly game: Game;

  constructor(config: Config) {
    this.socketServer = new WebSocketServer({ port: config.port });

    setInterval(() => {
      for (const [id, socket] of this.connections.entries()) {
        // const socket = this.connections.get(id);

        // Only proceed if the socket is actually open
        if (socket && socket.readyState === WebSocket.OPEN) {
          if (!socket.isAlive) {
            Log.SERVER.WARN(`Player ${id} timed out.`);
            socket.terminate();
            // handleSocketClose will be called automatically by the 'close' event
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
      registerConnections(this.connections);

      this.events.emit("player_join", {
        characterId: formatedCharacterId,
        playerId: formatedPlayerId,
      });

      socket.on("pong", () => {
        const socket = this.connections.get(formatedPlayerId);
        if (socket) {
          socket.isAlive = true;
          Log.SERVER.INFO(`Received PONG from PID ${formatedPlayerId}`);
        }
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
    // const player = this.players.get(playerId);
    // if (!player) return;

    // if (message.type === "TEXT_INPUT") {
    //   const rawText =
    //     typeof message.data === "string" ? message.data : message.data?.text;
    //   if (!rawText) return;

    //   const tokens = rawText.trim().split(/\s+/);
    //   if (tokens.length === 0 || tokens[0] === "") return;

    //   const trigger = tokens[0].toUpperCase();
    //   const args = tokens.slice(1);

    //   this.game.routeRequests(
    //     {
    //       type: trigger,
    //       data: { ...message.data, args },
    //     },
    //     player,
    //   );
    //   return;
    // }

    this.events.emit("route_requests", { request: message, playerId });
    // this.game.routeRequests(message, playerId);
  }

  private handleSocketClose(playerId: number, closingSocket: WebSocket): void {
    if (this.connections.get(playerId) === closingSocket) {
      // const player = this.players.get(playerId);
      // if (player) {
      //   this.players.delete(playerId);
      //   this.events.emit("player_disconnect", player);
      //   Log.SERVER.INFO(`${player.fullName} has disconnected.`);
      // }
      this.events.emit("player_disconnect", playerId);
      this.connections.delete(playerId);
      registerConnections(this.connections);
    }
  }

  public close(): void {
    this.socketServer.close();
  }
}
