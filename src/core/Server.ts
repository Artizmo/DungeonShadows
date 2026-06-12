import { WebSocketServer, WebSocket } from "ws";
import type { Config } from "~/@types/system";
import type { NetworkMessage} from '~/@types/server';
import type Game from "~/core/Game";
import Player from "~/core/Player";
import Logger from "~/core/Logger";
import { playersData } from '~/data/mock/mock';

export default class Server {
  public readonly logger = new Logger("SERVER");
  public readonly socketServer: WebSocketServer;
  public readonly players: Map<WebSocket, Player> = new Map();
  public readonly game: Game;

  constructor(config: Config, game: Game) {
    this.game = game;
    this.socketServer = new WebSocketServer({ port: config.port });

    this.socketServer.on("connection", (socket: WebSocket, request) => {
      const { origin } = request.headers;

      if (origin !== undefined && origin !== "http://localhost:3000") {
        this.logger.warn(`Blocked unauthorized connection from: ${origin}`);
        socket.close();
        return;
      }

      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) {
            this.logger.error(`Failed to handle incoming packet: No data!`);
            return;
          };

          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket);
          return;
        } catch (err) {
          this.logger.error(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", () => {
        this.handleSocketClose(socket);
      });

      socket.on("error", (error) => this.logger.error(`Socket error: ${error.message}`));
    });

    this.logger.info(`Server listening on port ${config.port}`);
  }

  private handleSocketMessage(message: NetworkMessage, socket: WebSocket): void {
    if (message.type === "CONNECT") {
      this.connect(message.data, socket);
      return;
    }

    const player = this.players.get(socket);
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
      this.logger.error("Connection failed. Invalid player references.");
      return;
    }

    const player = new Player(playersData.get(pid), socket);
    try {
      this.players.set(socket, player);
      this.logger.info(`${player.fullName} has connected!`);
    } catch (e) {
      this.logger.error(`${player.fullName} failed to connect: ${e}.`);
    }
  }

  private disconnect(player: Player): void {
    this.players.delete(player.socket);
    this.logger.info(`${player.fullName} has disconnected.`);
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