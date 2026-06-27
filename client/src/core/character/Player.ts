export interface IPlayer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default class Player implements IPlayer {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;

  constructor(player: IPlayer) {
    this.id = player.id;
    this.firstName = player.firstName;
    this.lastName = player.lastName;
    this.email = player.email;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
