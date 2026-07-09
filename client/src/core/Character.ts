import type { ActionRecord } from "~/shared/core/types";
import Zone from "~/core/Zone";

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  zone: Zone;
  position: {
    x: number;
    y: number;
  };
  renderPosition: {
    x: number;
    y: number;
  };
  stats: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
  };
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed: number = 3.6;
  sequenceId: number = 0;

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.renderPosition = { ...this.position };
  }
}
