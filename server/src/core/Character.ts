import type Zone from "~/core/Zone";
import type { ActionRecord, ICoords } from "~/shared/core/types";

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  stats: { hp: number; maxHp: number; mana: number; maxMana: number };
  zone: Zone;
  cameraWidth: number;
  cameraHeight: number;
  position: ICoords;
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed = 1;
  sequenceId = 0;
  lastProcessedSequenceId = 0;
  // 🟢 Track active chunks currently loaded on the client side
  activeAOI: Set<string> = new Set();
  currentBucketKey: string | null = null;

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.speed = character.speed;
    this.currentBucketKey = character.currentBucketKey || null;
    this.activeAOI = character.activeAOI
      ? new Set(character.activeAOI)
      : new Set();
    this.cameraWidth = character.cameraWidth;
    this.cameraHeight = character.cameraHeight;
  }

  get cameraMinX() {
    return this.position.x - this.cameraWidth / 2;
  }
  get cameraMaxX() {
    return this.position.x + this.cameraWidth / 2;
  }
  get cameraMinY() {
    return this.position.y - this.cameraHeight / 2;
  }
  get cameraMaxY() {
    return this.position.y + this.cameraHeight / 2;
  }

  move(velocity: { x: number; y: number }): void {
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }
}
