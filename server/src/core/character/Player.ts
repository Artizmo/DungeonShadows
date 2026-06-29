import type { IConnection } from "~/core/game/@types";

export default class Player {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  private connection: IConnection;

  constructor(player: Player, connection: IConnection) {
    this.id = player.id;
    this.firstName = player.firstName;
    this.lastName = player.lastName;
    this.email = player.email;
    this.connection = connection;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public send(packet: Uint8Array): void {
    this.connection.send(packet);
  }
}
