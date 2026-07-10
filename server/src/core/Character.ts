import type { ActionRecord } from "~/shared/core/types";
import Zone from "~/core/Zone";

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  zone: Zone;
  position: { x: number; y: number }; // The authoritative physics state
  prevPosition: { x: number; y: number }; // For the renderer to interpolate FROM
  renderPosition: { x: number; y: number }; // The fake visual camera target
  stats: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
  };
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed = 2;
  sequenceId = 0;
  lastProcessedSequenceId = 0;

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.prevPosition = { ...character.position };
    this.renderPosition = { ...this.position };
  }

  tick(): void {
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
  }

  move(velocity: { x: number; y: number }): void {
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }
}
