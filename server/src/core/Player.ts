export default class Player {
  id: number;
  firstName: string;
  lastName: string;
  email: string;

  constructor(player: Player) {
    this.id = player.id;
    this.firstName = player.firstName;
    this.lastName = player.lastName;
    this.email = player.email;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
