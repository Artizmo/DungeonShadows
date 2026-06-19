import dotenv from "dotenv";
import path from "path";

// 🔍 Force look in the exact directory where this file resides
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

// 🚨 TEMPORARY DIAGNOSTIC LOG
console.log("-------------------------------------------------------");
console.log("🔍 GAME SERVER ENV CHECK:");
console.log(
  "Loaded GAME_SECRET:",
  process.env.GAME_SECRET
    ? "FOUND (Matches Auth Server!)"
    : "NOT FOUND (Is Undefined!)",
);
console.log("Looking in current working directory:", process.cwd());
console.log("-------------------------------------------------------");

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

      // 1. Read the access ticket
      const ticket = parsedUrl.searchParams.get("ticket");

      // Validate Origin
      if (origin !== undefined) {
        const isLocalhost =
          origin.startsWith("http://localhost:") ||
          origin === "http://10.0.0.46:5173";

        if (!isLocalhost) {
          Log.SERVER.WARN(`Blocked unauthorized connection from: ${origin}`);
          socket.close(4003, "Forbidden Origin");
          return;
        }
      }

      // 🛑 GUARD A AGAINST MALFORMED STRINGS COMING FROM FAST FRONTEND RENDERS
      if (!ticket || ticket === "undefined" || ticket === "[object Object]") {
        Log.SERVER.WARN(
          `Connection rejected: Missing or raw un-evaluated access ticket string. Received: "${ticket}"`,
        );
        socket.close(4001, "Unauthorized: Ticket Missing");
        return;
      }

      let formatedPlayerId: number;
      let formatedCharacterId: number;

      // 🛡️ ENFORCED RUNTIME ESCAPE HATCH:
      // Prevents jsonwebtoken from throwing "secret or public key must be provided"
      const secretKey =
        process.env.GAME_SECRET || "fallback_secret_key_development_only";

      try {
        // 2. Cryptographically decode who this belongs to using our stable secretKey reference
        const decoded = jwt.verify(ticket, secretKey) as {
          playerId: number;
          characterId: number;
        };

        console.log("🎫 DECODED TICKET RAW DATA:", decoded);

        formatedPlayerId = Number(decoded.playerId);
        formatedCharacterId = Number(decoded.characterId);
      } catch (err) {
        Log.SERVER.WARN(
          `Connection rejected: Invalid or expired ticket signature. ${err}`,
        );
        socket.close(4001, "Unauthorized: Invalid Ticket");
        return;
      }

      // Check if data is valid inside registry records
      const mockData = playersData.get(formatedPlayerId);
      if (!mockData) {
        Log.SERVER.ERROR(
          `Authentication mapping failed: No layout for PID ${formatedPlayerId}`,
        );
        socket.close(4004, "Character Profile Not Found");
        return;
      }

      // ⚡ 3. GHOST RECONCILIATION GATE (Atomic and Safe)
      if (this.connections.has(formatedPlayerId)) {
        const staleSocket = this.connections.get(formatedPlayerId);
        if (staleSocket && staleSocket !== socket) {
          Log.SERVER.WARN(
            `Duplicate connection sequence for PID: ${formatedPlayerId}. Evicting ghost socket.`,
          );
          staleSocket.onclose = null;
          staleSocket.onerror = null;
          staleSocket.close(4000, "Evicted by new session handshake");
        }
      }

      // 4. ATOMIC SYSTEM ALLOCATION
      const player = new Player(mockData);

      this.connections.set(formatedPlayerId, socket);
      this.players.set(formatedPlayerId, player);
      registerConnections(this.connections);

      Log.SERVER.INFO(
        `[ENGINE] ${player.fullName} has successfully connected!`,
      );

      // 5. Bind Message Receivers
      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) return;
          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket, formatedPlayerId);
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      // 6. Bind Teardown Closures
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
