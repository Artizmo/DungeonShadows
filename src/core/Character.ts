import type { Position, Stats } from '~/@types/game';
import type { CharacterRecord } from '~/data/mock/mock';
import Logger from './Logger';

export default class Character {
  public id: number;
  public ownerPlayerId: number | null;
  public name: string;
  public position: Position;
  public stats: Stats;
  public inventory: string[] = [];
  public isDead: boolean = false;
  logger: Logger = new Logger("CHAR");

  constructor(characterRecord: CharacterRecord) {
    this.id = characterRecord.id;
    this.name = characterRecord.name;
    this.ownerPlayerId = characterRecord.playerId;
    this.stats = characterRecord.stats;
  }

  public getInventory(): string[] {
    return this.inventory;
  }

  public update(tick: number): void {
  }

  public tick(tick: number): void {
  }
}