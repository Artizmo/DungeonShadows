import type Character from "~/core/character/Character";
import type { PlayerRecord } from "~/shared/data/mock/mock";
import { send } from "~/_utils/messageBroker";

export default class Player {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public character: Character | null;
  public isAlive: boolean = true;

  constructor(playerRecord: PlayerRecord) {
    this.id = playerRecord.id;
    this.firstName = playerRecord.firstName;
    this.lastName = playerRecord.lastName;
    this.email = playerRecord.email;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public send(data: any): void {
    send(this.id, data);
  }
}
