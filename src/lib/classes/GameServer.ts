import { WebSocketServer } from "ws";
import Player from "./Player";
import Character from "./Character";
import { REQUEST_TYPES, RESPONSE_TYPES } from "../../utils/constants";
import { mockFetchAvailableCharacters, mockFetchPlayer, mockFetchCharacter } from "../../utils/mock";
import { GameEvents } from "../types/game";
import { CharacterSelection, PingTimes } from "../types/server";
import { Request, RequestHandlers } from "../types/ServerRequest";

export default class GameServer {
  private connectionPingInterval: NodeJS.Timeout;
  private connectionPulseInterval: NodeJS.Timeout;
  private server: WebSocketServer;
  private gameEvents: GameEvents;
  private players: Map<number, Player>;
  requestHandlers: RequestHandlers = new Map([
    [REQUEST_TYPES.CONNECT, data => this.handleConnect(data)],
    [REQUEST_TYPES.DISCONNECT, data => this.handleDisconnect(data)],
    [REQUEST_TYPES.JOIN, data => this.handleJoin(data)],
    [REQUEST_TYPES.PING, data => this.handleAcknowledgePing(data)]
  ]);

  constructor(port: number, gameEvents: GameEvents) {
    this.players = new Map();
    this.gameEvents = gameEvents;   
    this.server = new WebSocketServer({ port })
      .on('connection', (connection, request) => {
        connection.on('message', data => {
          try {
            const message = JSON.parse(data.toString());            
            const handler = this.requestHandlers.get(message.type);
            handler({ message, connection, request });
          } catch(error) {
            console.log(`Server could not handle request: ${error}`);
          }
        });
      })
      .on('close', () => this.close());
    
    this.connectionPulseInterval = setInterval(() => this.checkPulse(), 250);
    this.connectionPingInterval = setInterval(() => this.checkPing(), 1000);
    
    process.on('SIGINT', () => {
      this.close();
      process.exit();
    });

    console.log(`Game server is running ${port}.`);
  }

  handleConnect({ message, connection }: Request<number>) {
    const pid = message.data;
    if (!pid) return;

    const currentPlayer = this.players.get(pid);
    if (currentPlayer) return currentPlayer.dispose();
    
    const savedPlayer = mockFetchPlayer(pid)
    const player = new Player(savedPlayer, connection)
    player.isAlive = true
    this.addPlayer(player)
    
    const availableCharacters = mockFetchAvailableCharacters(pid)
    player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.AVAILABLE_CHARACTERS, data: availableCharacters }))
  }

  handleDisconnect({ message }: Request<{ pid: number, cid: number }>) {
    console.log('bingo disconnect?')
    const { pid } = message.data
    if (!pid) return

    this.disconnectPlayer(pid)
  }

  handleJoin({ message }: Request<CharacterSelection>) {
    const { cid, pid } = message.data
    if (!pid || !cid) return
    
    const savedCharacter = mockFetchCharacter(cid)
    const player = this.players.get(savedCharacter.pid)
    const character = new Character(savedCharacter, player, this.gameEvents)
    this.gameEvents.emit('join', character)
  }

  // command({ message }: Request<{ pid: number, name: string, command: string }>) {
  //   const { name, command } = message.data
  //   const words = command.split(' ')
  //   const [_, ...text] = words

  //   this.players.forEach(player => {
  //     player.connection.send(JSON.stringify({ 
  //       type: RESPONSE_TYPES.CHAT, 
  //       data: { sender: name, message: text.join(' ') }
  //     }))
  //   })
  // }
  
  close() {
    clearInterval(this.connectionPulseInterval)
    clearInterval(this.connectionPingInterval)

    this.gameEvents.emit('abort')
  }

  disconnectPlayer(pid: number) {
    if (!pid) return 

    const player = this.players.get(pid)
    if (!player) return

    player.dispose()
    this.removePlayer(player.id)
    this.gameEvents.emit('disconnect', pid)
  }

  addPlayer(player: Player) {
    console.log('bingo add player', player.firstName)
    this.players.set(player.id, player)
  }

  removePlayer(pid: number) {
    console.log('bingo remove player', this.players.get(pid).firstName)
    this.players.delete(pid)
  }

  private handleAcknowledgePing({ message }: Request<PingTimes>) {
    const pingTimes = message.data

    this.players.forEach(player => {
      if (!player.isAlive) return

      pingTimes.serverAckTime = performance.now()
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_ACK_PING_TIME, data: pingTimes }))
    })
  }

  private checkPulse() {
    for (const player of this.players.values()) {
      const { id: pid } = player
      if (!player.isAlive) this.disconnectPlayer(pid)

      player.isAlive = player.connection.readyState === 1
      player.ping()
    }
  }

  private checkPing() {
    this.players.forEach(player => {
      if (!player.isAlive) return

      const pingTimes: PingTimes = { 
        serverTime: performance.now() 
      }
      player.connection.send(JSON.stringify({ type: RESPONSE_TYPES.SERVER_PING_TIME, data: pingTimes }))
    })
  }
}