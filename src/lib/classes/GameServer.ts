import { WebSocketServer } from "ws";
import type GameEvents from "./GameEvents";
import { PingTimes, Request, RequestHandlers } from "../types/server";
import { REQUEST_TYPES, RESPONSE_TYPES } from "../../utils/constants";
import { mockFetchPlayerFile } from "../../utils/mock";
import Player from "./Player";

export default class GameServer {
  gameEvents: GameEvents;
  server: WebSocketServer;
  connectionPingInterval: NodeJS.Timeout = setInterval(() => this.checkPulse(), 250);
  connectionPulseInterval: NodeJS.Timeout = setInterval(() => this.checkPing(), 1000);  
  requestHandlers: RequestHandlers = new Map([
    [REQUEST_TYPES.CONNECT, data => this.handleConnect(data)],
    [REQUEST_TYPES.DISCONNECT, data => this.handleDisconnect(data)],
    [REQUEST_TYPES.PING, data => this.handleAcknowledgePing(data)]
  ]);
  players: Map<number, Player> = new Map();
  input: (args: any) => void;
  connect: (args: any) => void;

  constructor(port: number, gameEvents: GameEvents) {
    this.gameEvents = gameEvents;   
    this.server = new WebSocketServer({ port })
      .on("connection", (connection, request) => {
        const { origin } = request.headers;
        if (origin !== undefined && origin !== "http://localhost:3000") {
          console.log(`Server detected unknown origin: ${request.headers.origin}`);
          connection.close();
        }

        // handle token auth here (token from web auth should match token here)
        
        connection.on("message", data => {
          try {
            const message = JSON.parse(data.toString());            
            const handler = this.requestHandlers.get(message.type);

            handler({ message, connection, request });
          } catch(error) {
            console.log(`Server could not handle request: ${error}`);
          }
        });
      })
      .on("error", error => console.log(`Server has encountered error: ${error}`))
      .on("close", () => this.close());
    
    process.on("SIGINT", () => {
      this.close();
      process.exit();
    });

    console.log(`Game server is running ${port}.`);
  }

  handleConnect({ message, connection }: Request<{ pid: number, cid: number }>) {
    const { cid, pid } = message.data;
    if (!pid || !cid) return;
    
    const playerFile = mockFetchPlayerFile(pid);
    const player = new Player(playerFile, connection);
    console.log('bingo connect', player)
    this.addPlayer(player);
    this.connect(player);
  }

  handleDisconnect({ message }: Request<number>) {
    const pid = message.data;
    if (!pid) return;

    this.removePlayer(pid);
  }

  handleInput({ data }: any) {
    this.input(data);
  }
 
  handleAcknowledgePing({ message }: Request<PingTimes>) {
    const pingTimes = message.data;

    this.players.forEach(player => {
      if (!player.isAlive) return;

      pingTimes.serverAckTime = performance.now();
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_ACK_PING_TIME, data: pingTimes }));
    })
  }

  addPlayer(player: Player) {
    if (!player) return;

    this.players.set(player.pid, player);
  }

  removePlayer(pid: number) {
    const player = this.players.get(pid);
    if (!player) return;

    player.connection.terminate();
    this.players.delete(pid);
  }

  checkPulse() {
    for (const player of this.players.values()) {
      console.log('bingo players', this.players.size, this.players.get(player.pid).isAlive);
      if (!player.isAlive) {
        this.removePlayer(player.pid);
        continue;
      }

      player.isAlive = player.connection.readyState === 1;
      player.connection.ping();
    }
  }

  checkPing() {
    for (const player of this.players.values()) {
      if (!player.isAlive) {
        this.removePlayer(player.pid);
        continue;
      }

      const pingTimes: PingTimes = { 
        serverTime: performance.now()
      };
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_PING_TIME, data: pingTimes }));
    }
  }
  
  close() {
    clearInterval(this.connectionPulseInterval);
    clearInterval(this.connectionPingInterval);
  }
}