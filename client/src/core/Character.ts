import type { ActionType, ICoords } from "~/shared/core/types";
import Zone from "~/core/Zone";
import type { CommandType } from "./utils/input-dictionary";

export default class Character {
  id: number;
  playerId: number;
  name: string;
  level: number;
  zone!: Zone;
  position: ICoords;
  prevPosition: ICoords;
  renderPosition: ICoords;
  cameraWidth: number;
  cameraHeight: number;
  stats: {
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
  };
  isAlive: boolean;
  pendingActions: Array<{
    sequenceId: number;
    tick: number;
    action: ActionType;
    activeCommands: Set<CommandType>;
  }> = [];
  speed = 1;
  sequenceId: number = 0;
  isMoving: boolean = false;
  currentBucketId: string;
  AOIBucketKeys: [];

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.prevPosition = { ...character.position };
    this.cameraWidth = character.cameraWidth;
    this.cameraHeight = character.cameraHeight;
    this.renderPosition = { ...this.position };
    this.speed = character.speed;
    this.currentBucketId = character.currentBucketId;
    this.AOIBucketKeys = character.AOIBucketKeys;
  }

  tick() {
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
    this.isMoving = false;
  }

  move(velocity: { x: number; y: number }): void {
    this.isMoving = true;
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }
}
