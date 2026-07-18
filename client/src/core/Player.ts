export default class Player {
  public id: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;

  constructor(player: Player) {
    this.id = player.id;
    this.firstName = player.firstName;
    this.lastName = player.lastName;
    this.email = player.email;
  }

  public get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
