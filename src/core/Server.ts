import { WebSocketServer, WebSocket } from "ws";
import type { Config } from "~/@types/system";
import type { NetworkMessage } from "~/@types/server";
import type Game from "~/core/Game";
import Player from "~/core/Player";
import Log from "~/core/Logger";
import { playersData } from "data/mock/mock";
import { registerConnections } from "~/utils/messageBroker";

type PlayerId = number;
type PlayerToken = string;

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
      const pid = parsedUrl.searchParams.get("pid");
      const token = parsedUrl.searchParams.get("token");

      // 1. Validate Origin (Send status 4003 - Forbidden)
      if (origin !== undefined) {
        const isLocalhost =
          origin.startsWith("http://localhost:") ||
          origin === "http://localhost";

        if (!isLocalhost) {
          Log.SERVER.WARN(`Blocked unauthorized connection from: ${origin}`);
          socket.close(4003, "Forbidden Origin");
          return;
        }
      }

      // 2. Validate Parameters exist (Send status 4001 - Unauthorized)
      if (!pid || !token) {
        Log.SERVER.WARN("Connection rejected: Missing credentials.");
        socket.close(4001, "Unauthorized");
        return;
      }

      const playerId: number = Number(pid);
      const playerToken: string = String(token);

      if (Number.isNaN(playerId)) {
        Log.SERVER.WARN(`Connection rejected: Malformed numeric PID (${pid})`);
        socket.close(4001, "Malformed Player ID");
        return;
      }

      // ⚡ 3. THE GHOST RECONCILIATION GATE
      // If an un-upgraded or stale socket is currently held in memory for this ID, drop it safely
      if (this.connections.has(playerId)) {
        Log.SERVER.WARN(
          `Duplicate connection sequence for PID: ${playerId}. Evicting ghost socket.`,
        );
        const staleSocket = this.connections.get(playerId);
        if (staleSocket) {
          staleSocket.onclose = null; // Unbind to stop double invocation loops
          staleSocket.close(4000, "Evicted by new session handshake");
        }
        this.connections.delete(playerId);
      }

      // Explicitly register the raw network socket right now to block fast double-taps
      this.connections.set(playerId, socket);

      // 4. Bind Message Receivers
      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) {
            Log.SERVER.ERROR(`Failed to handle incoming packet: No data!`);
            return;
          }

          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket, playerId, playerToken);
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      // 5. Bind Teardown Closures
      socket.on("close", (code) => {
        Log.SERVER.INFO(
          `Socket close event fired for PID ${playerId} (Code: ${code})`,
        );
        this.handleSocketClose(playerId, socket);
      });

      socket.on("error", (error) =>
        Log.SERVER.ERROR(`Socket error for PID ${playerId}: ${error.message}`),
      );
    });

    Log.SERVER.INFO(`Server listening on port ${config.port}.`);
  }

  private handleSocketMessage(
    message: NetworkMessage,
    socket: WebSocket,
    playerId: PlayerId,
    token: PlayerToken,
  ): void {
    if (message.type === "CONNECT") {
      this.connect(socket, playerId, token);
      return;
    }

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

  // 👇 Modified to cross-check socket references before dropping states
  private handleSocketClose(
    playerId: PlayerId,
    closingSocket: WebSocket,
  ): void {
    // Only clear components out if the socket that is dying is the actual active stream item
    if (this.connections.get(playerId) === closingSocket) {
      this.connections.delete(playerId);
    }

    const player = this.players.get(playerId);
    if (player) {
      this.game.shutdownPlayer(player);
      this.disconnect(player);
      Log.SERVER.INFO(
        `${player.fullName} state cleared from player pool maps.`,
      );
    }

    registerConnections(this.connections);
  }

  private connect(
    socket: WebSocket,
    playerId: PlayerId,
    token: PlayerToken,
  ): void {
    if (!token || !playerId) {
      Log.SERVER.ERROR("Connection failed. Invalid player references.");
      return;
    }

    // Guard checking mock registry data validation
    const mockData = playersData.get(playerId);
    if (!mockData) {
      Log.SERVER.ERROR(
        `Authentication mapping failed: No layout for PID ${playerId}`,
      );
      socket.close(4004, "Character Profile Not Found");
      return;
    }

    const player = new Player(mockData);

    try {
      this.connections.set(player.id, socket);
      this.players.set(player.id, player);
      registerConnections(this.connections);

      Log.SERVER.INFO(`${player.fullName} has connected!`);
    } catch (e) {
      Log.SERVER.ERROR(`${player.fullName} failed to connect: ${e}.`);
    }
  }

  private disconnect(player: Player): void {
    this.connections.delete(player.id);
    this.players.delete(player.id);
    registerConnections(this.connections);

    Log.SERVER.INFO(`${player.fullName} has disconnected.`);
  }

  public close(): void {
    this.socketServer.close();
  }
}
