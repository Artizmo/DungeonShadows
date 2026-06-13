import { WebSocket } from "ws";
import type Character from './Character';
import type { PlayerRecord } from 'data/mock/mock';

export default class Player {
  public readonly socket: WebSocket;
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public character: Character | null;

  constructor(playerRecord: PlayerRecord, socket: WebSocket) {
    this.id = playerRecord.id;
    this.firstName = playerRecord.firstName;
    this.lastName = playerRecord.lastName;
    this.email = playerRecord.email;
    this.socket = socket;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public send(payload: { type: string; data: any }): void {
    if (this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }
}