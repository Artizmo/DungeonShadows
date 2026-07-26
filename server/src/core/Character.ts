import type { ActionRecord, ICoords } from "~/shared/core/types";

export enum CharacterDirtyFlag {
  NONE = 0,
  POSITION = 1 << 0, // x, y, rotation
  STATS = 1 << 1, // hp, mana, stamina
  COMBAT = 1 << 2, // casting, targeting
  EQUIPMENT = 1 << 3, // gear, weapons
}

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  stats: { hp: number; maxHp: number; mana: number; maxMana: number };
  areaId: string;
  zoneId: string;
  cameraWidth: number;
  cameraHeight: number;
  position: ICoords;
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed = 1;
  sequenceId = 0;
  lastProcessedSequenceId = 0;
  AOIBucketKeys: Set<string> = new Set();
  currentBucketId: string | null = null;
  dirtyFlags: CharacterDirtyFlag = CharacterDirtyFlag.NONE;

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.areaId = character.areaId;
    this.zoneId = character.zoneId;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.speed = character.speed;
    this.currentBucketId = character.currentBucketId || null;
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
    this.dirtyFlags |= CharacterDirtyFlag.POSITION;
  }
}
