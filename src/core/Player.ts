import type Character from './Character';
import type { PlayerRecord } from 'data/mock/mock';
import { send } from '~/utils/messageBroker';

export default class Player {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public character: Character | null;

  constructor(playerRecord: PlayerRecord) {
    this.id = playerRecord.id;
    this.firstName = playerRecord.firstName;
    this.lastName = playerRecord.lastName;
    this.email = playerRecord.email;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public send(payload: { type: string; data: any }): void {
    send(this.id, payload);
  }
}