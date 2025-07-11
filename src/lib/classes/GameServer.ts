import { WebSocketServer } from "ws";
import { PingTimes, Request, RequestHandlers } from "../types/server";
import type { Config } from "../types/system";
import { REQUEST_TYPES, RESPONSE_TYPES } from "../../utils/constants";
import { mockFetchPlayerFile } from "../../utils/mock";
import Player from "./Player";

export default class GameServer {
  server: WebSocketServer;
  connectionPingInterval: NodeJS.Timeout = setInterval(() => this.checkPulse(), 250);
  connectionPulseInterval: NodeJS.Timeout = setInterval(() => this.checkPing(), 1000);
  requestHandlers: RequestHandlers = new Map([
    [REQUEST_TYPES.CONNECT, data => this.handleConnect(data)],
    [REQUEST_TYPES.DISCONNECT, data => this.handleDisconnect(data)],
    // [REQUEST_TYPES.FETCH_CHARACTER, data => this.handleFetchCharacter(data)],
    [REQUEST_TYPES.INVENTORY, data => this.handleInventory(data)],
    [REQUEST_TYPES.PING, data => this.handleAcknowledgePing(data)]
  ]);
  players: Map<number, Player> = new Map();
  connect: (args: any) => void;
  inputCallback: (data: any) => void;

  constructor(config: Config, inputCallback: (data: any) => void) {
    this.inputCallback = inputCallback;
    this.server = new WebSocketServer({
      port: config.port,
      perMessageDeflate: {
        zlibDeflateOptions: {
          chunkSize: 1024,
          memLevel: 7,
          level: 3
        },
        zlibInflateOptions: {
          chunkSize: 1024
        },
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        concurrencyLimit: 10,
        threshold: 1024,
      }
    })
      .on("connection", (connection, request) => {
        const { origin } = request.headers;
        if (origin !== undefined && origin !== "http://localhost:3000") {
          console.log(`Server detected unknown origin: ${request.headers.origin}`);
          connection.close();
        }

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

    console.log(`Server is up and running on port ${config.port}.`);
  }

  handleConnect({ message, connection }: Request<{ pid: number, cid: number }>) {
    const { cid, pid } = message.data;
    console.log('bingo server cid pid', cid, pid)
    if (!pid || !cid) return;

    const playerFile = mockFetchPlayerFile(pid);
    const player = new Player(playerFile, connection);
    console.log('bingo connect', `${player.lastName}, ${player.firstName}`)
    this.addPlayer(player);
  }

  handleDisconnect({ message }: Request<number>) {
    const pid = message.data;
    if (!pid) return;

    this.removePlayer(pid);
  }

  handleInventory({ message }: Request<{ pid: number, cid: number }>) {
    const { cid, pid } = message.data;
    if (!pid || !cid) return;

    const player = this.players.get(pid);
    console.log('bingo fetching inventory for player', player.firstName, cid);
    player.connection.send(JSON.stringify({ type: "INVENTORY", data: [101, 102, 103, 104, 105] }));
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