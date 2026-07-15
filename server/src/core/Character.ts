import type { ActionRecord } from "~/shared/core/types";
import Zone from "~/core/Zone";

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  zone: Zone;
  camera: {
    width: number;
    height: number;
    readonly minX: number;
    readonly maxX: number;
    readonly minY: number;
    readonly maxY: number;
  };
  position: { x: number; y: number };
  prevPosition: { x: number; y: number };
  renderPosition: { x: number; y: number };
  stats: { hp: number; maxHp: number; mana: number; maxMana: number };
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed = 1;
  sequenceId = 0;
  lastProcessedSequenceId = 0;

  // 🟢 Track active chunks currently loaded on the client side
  public activeAOI: Set<string> = new Set();
  public currentBucketKey: string | null = null;

  constructor(character: Character) {
    console.log("bingo zone", character.zone);
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
    this.speed = character.speed;
    this.currentBucketKey = character.currentBucketKey || null;
    this.activeAOI = character.activeAOI
      ? new Set(character.activeAOI)
      : new Set();

    // 🟢 Capture character scope so getters don't evaluate to NaN
    const self = this;

    this.camera = {
      width: character.camera.width,
      height: character.camera.height,
      get minX() {
        return self.position.x - this.width / 2;
      },
      get maxX() {
        return self.position.x + this.width / 2;
      },
      get minY() {
        return self.position.y - this.height / 2;
      },
      get maxY() {
        return self.position.y + this.height / 2;
      },
    };
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
