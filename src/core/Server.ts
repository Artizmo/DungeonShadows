import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { WebSocketServer, WebSocket } from "ws";
import type { Config } from "~/@types/system";
import type { NetworkMessage } from "~/@types/server";
import type Game from "~/core/Game";
import Player from "~/core/Player";
import Log from "~/core/Logger";
import { playersData } from "data/mock/mock";
import { registerConnections } from "~/utils/messageBroker";
import jwt from "jsonwebtoken";

type PlayerId = number;

export default class Server {
  public readonly socketServer: WebSocketServer;
  public readonly connections: Map<PlayerId, WebSocket> = new Map();
  public readonly players: Map<PlayerId, Player> = new Map();
  public readonly game: Game;

  constructor(config: Config, game: Game) {
    this.game = game;
    this.socketServer = new WebSocketServer({ port: config.port });

    this.socketServer.on("connection", (socket: WebSocket, request) => {
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
        Log.SERVER.WARN(
          `Connection rejected: Invalid ticket signature. ${err}`,
        );
        socket.close(4001, "Unauthorized: Invalid Ticket");
        return;
      }

      const mockData = playersData.get(formatedPlayerId);
      if (!mockData) {
        Log.SERVER.ERROR(
          `Authentication mapping failed: No data for PID ${formatedPlayerId}`,
        );
        socket.close(4004, "Character Profile Not Found");
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

      const player = new Player(mockData);

      this.connections.set(formatedPlayerId, socket);
      this.players.set(formatedPlayerId, player);
      registerConnections(this.connections);

      Log.SERVER.INFO(`${player.fullName} has successfully connected!`);

      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) return;
          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket, formatedPlayerId);
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", () => {
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

  private handleSocketMessage(
    message: NetworkMessage,
    socket: WebSocket,
    playerId: PlayerId,
  ): void {
    const player = this.players.get(playerId);
    if (!player) return;

    if (message.type === "TEXT_INPUT") {
      const rawText =
        typeof message.data === "string" ? message.data : message.data?.text;
      if (!rawText) return;

      const tokens = rawText.trim().split(/\s+/);
      if (tokens.length === 0 || tokens[0] === "") return;

      const trigger = tokens[0].toUpperCase();
      const args = tokens.slice(1);

      this.game.routeCommands(
        {
          type: trigger,
          data: { ...message.data, args },
        },
        player,
      );
      return;
    }

    this.game.routeCommands(message, player);
  }

  private handleSocketClose(
    playerId: PlayerId,
    closingSocket: WebSocket,
  ): void {
    if (this.connections.get(playerId) === closingSocket) {
      const player = this.players.get(playerId);
      if (player) {
        this.game.shutdownPlayer(player);
        this.players.delete(playerId);
        Log.SERVER.INFO(`${player.fullName} has disconnected.`);
      }
      this.connections.delete(playerId);
      registerConnections(this.connections);
    }
  }

  public close(): void {
    this.socketServer.close();
  }
}
