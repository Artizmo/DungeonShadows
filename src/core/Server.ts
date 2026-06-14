import { WebSocketServer, WebSocket } from "ws";
import type { Config } from "~/@types/system";
import type { NetworkMessage} from '~/@types/server';
import type Game from "~/core/Game";
import Player from "~/core/Player";
import Log from "~/core/Logger";
import { playersData } from 'data/mock/mock';
import { registerConnections } from '~/utils/messageBroker';

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
      const { origin, pid, token } = request.headers;
      if (origin !== undefined && origin !== "http://localhost:3000") {
        Log.SERVER.WARN(`Blocked unauthorized connection from: ${origin}`);
        socket.close();
        return;
      }

      if (!pid || !token) {
        socket.close();
        return;
      }

      const playerId: number = Number(pid);
      const playerToken: string = String(token);
      if (Number.isNaN(playerId)) {
        socket.close();
      }

      socket.on("message", (rawData: Buffer) => {
        try {
          if (!rawData) {
            Log.SERVER.ERROR(`Failed to handle incoming packet: No data!`);
            return;
          };

          const message = JSON.parse(rawData.toString("utf-8"));
          this.handleSocketMessage(message, socket, playerId, playerToken);
          return;
        } catch (err) {
          Log.SERVER.ERROR(`Failed to handle incoming packet: ${err}`);
        }
      });

      socket.on("close", () => {
        this.handleSocketClose(playerId);
        console.log('bingo this.connections', this.connections.size)
        registerConnections(this.connections);
      });

      socket.on("error", (error) => Log.SERVER.ERROR(`Socket error: ${error.message}`));
    });

    Log.SERVER.INFO(`Server listening on port ${config.port}`);
  }

  private handleSocketMessage(
    message: NetworkMessage,
    socket: WebSocket,
    playerId: PlayerId,
    token: PlayerToken
  ): void {
    if (message.type === "CONNECT") {
      this.connect(socket, playerId, token);
      return;
    }

    const player = this.players.get(playerId);
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

  private handleSocketClose(playerId: PlayerId): void {
    const player = this.players.get(playerId);
    if (!player) return;

    this.game.shutdownPlayer(player);
    this.disconnect(player);
  }

  private connect( socket: WebSocket, playerId: PlayerId, token: PlayerToken): void {
    if (!token || !playerId) {
      Log.SERVER.ERROR("Connection failed. Invalid player references.");
      return;
    }

    const player = new Player(playersData.get(playerId));

    try {
      this.connections.set(player.id, socket);
      this.players.set(player.id, player);
      registerConnections(this.connections);
      console.log('bingo this.connections', this.connections.size)

      Log.SERVER.INFO(`${player.fullName} has connected!`);
    } catch (e) {
      Log.SERVER.ERROR(`${player.fullName} failed to connect: ${e}.`);
    }
  }

  private disconnect(player: Player): void {
    this.connections.delete(player.id);
    this.players.delete(player.id);
    registerConnections(this.connections);
    console.log('bingo this.connections', this.connections.size)

    Log.SERVER.INFO(`${player.fullName} has disconnected.`);
  }

  public close(): void {
    this.socketServer.close();
  }
}