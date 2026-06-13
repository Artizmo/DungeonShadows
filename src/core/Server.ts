import { WebSocketServer, WebSocket } from "ws";
import type { Config } from "~/@types/system";
import type { NetworkMessage} from '~/@types/server';
import type Game from "~/core/Game";
import Player from "~/core/Player";
import Log from "~/core/Logger";
import { playersData } from 'data/mock/mock';

export default class Server {
  public readonly socketServer: WebSocketServer;
  public readonly players: Map<WebSocket, Player> = new Map();
  public readonly game: Game;

  constructor(config: Config, game: Game) {
    this.game = game;
    this.socketServer = new WebSocketServer({ port: config.port });

    this.socketServer.on("connection", (socket: WebSocket, request) => {
      const { origin } = request.headers;

      if (origin !== undefined && origin !== "http://localhost:3000") {
        Log.SERVER.WARN(`Blocked unauthorized connection from: ${origin}`);
        socket.close();
        return;
      }

      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) {
            Log.SERVER.ERROR(`Failed to handle incoming packet: No data!`);
            return;
          };

          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket);
          return;
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", () => {
        this.handleSocketClose(socket);
      });

      socket.on("error", (error) => Log.SERVER.ERROR(`Socket error: ${error.message}`));
    });

    Log.SERVER.INFO(`Server listening on port ${config.port}`);
  }

  private handleSocketMessage(message: NetworkMessage, socket: WebSocket): void {
    if (message.type === "CONNECT") {
      this.connect(message.data, socket);
      return;
    }

    const player = this.players.get(socket);
    if (!player) return;

    if (message.type === "TEXT_INPUT") {
      const rawText = typeof message.data === "string" ? message.data : message.data?.text;
      if (!rawText) return;

      const tokens = rawText.trim().split(/\s+/);
      if (tokens.length === 0 || tokens[0] === "") return;

      const trigger = tokens[0].toUpperCase();
      const args = tokens.slice(1);

      this.game.routeCommands({
        type: trigger,
        data: { ...message.data, args }
      }, player);

      return;
    }

    this.game.routeCommands(message, player);
  }

  private handleSocketClose(socket: WebSocket): void {
    const player = this.players.get(socket);
    if (!player) return;

    this.game.shutdownPlayer(player);
    this.disconnect(player);
  }

  private connect({ pid, token }, socket: WebSocket): void {
    if (!token || !pid) {
      Log.SERVER.ERROR("Connection failed. Invalid player references.");
      return;
    }

    const player = new Player(playersData.get(pid), socket);
    try {
      this.players.set(socket, player);
      Log.SERVER.INFO(`${player.fullName} has connected!`);
    } catch (e) {
      Log.SERVER.ERROR(`${player.fullName} failed to connect: ${e}.`);
    }
  }

  private disconnect(player: Player): void {
    this.players.delete(player.socket);
    Log.SERVER.INFO(`${player.fullName} has disconnected.`);
  }

  public broadcast(type: string, data: any): void {
    for (const player of this.players.values()) {
      player.send({ type, data });
    }
  }

  public close(): void {
    this.socketServer.close();
  }
}