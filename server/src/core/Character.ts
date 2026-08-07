import type {
  ActionRecord,
  CharacterRecord,
  ICamera,
  Vector2D,
} from "~/shared/core/types";
import type Player from "~/core/Player";
import type { Entity } from "~/shared/core/types";

export default class Character implements Entity {
  id: number;
  player: Player;
  name: string;
  level: number;
  areaId: string;
  zoneId: string;
  camera: ICamera;
  width = 32;
  height = 32;
  transform: {
    position: Vector2D;
    rotation: number;
  };
  pendingActions: ActionRecord[] = [];
  speed = 1;
  sequenceId = 0;

  constructor(characterRecord: CharacterRecord) {
    this.id = characterRecord.id;
    this.name = characterRecord.name;
    this.level = characterRecord.level;
    this.areaId = characterRecord.areaId;
    this.zoneId = characterRecord.zoneId;
    this.transform = {
      position: {
        x: characterRecord.x ?? 0,
        y: characterRecord.y ?? 0,
      },
      rotation: characterRecord.rotation ?? 0,
    };
    this.width = characterRecord.width ?? this.width;
    this.height = characterRecord.height ?? this.height;
    this.speed = characterRecord.speed;
  }

  get cameraMinX() {
    return this.transform.position.x - this.camera.width / 2;
  }
  get cameraMaxX() {
    return this.transform.position.x + this.camera.width / 2;
  }
  get cameraMinY() {
    return this.transform.position.y - this.camera.height / 2;
  }
  get cameraMaxY() {
    return this.transform.position.y + this.camera.height / 2;
  }

  move(velocity: { x: number; y: number }): void {
    this.transform.position.x += velocity.x;
    this.transform.position.y += velocity.y;
  }
}
