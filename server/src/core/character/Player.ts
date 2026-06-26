import type { IConnection } from "~/core/game/@types";
import type Character from "~/core/character/Character";
import type { PlayerRecord } from "~/shared/data/mock/mock";

export default class Player {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public character: Character | null;
  public isAlive: boolean = true;
  private connection: IConnection;

  constructor(playerRecord: PlayerRecord, connection: IConnection) {
    this.id = playerRecord.id;
    this.firstName = playerRecord.firstName;
    this.lastName = playerRecord.lastName;
    this.email = playerRecord.email;
    this.connection = connection;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public send(packet: Uint8Array): void {
    this.connection.send(packet);
  }
}
