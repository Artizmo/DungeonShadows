import type {
  ActionType,
  CharacterRecord,
  Vector2D,
} from "~/shared/core/types";
import type { CommandType } from "./utils/input-dictionary";

export default class Character {
  id: number = 0;
  playerId: number = 0;
  name: string = "";
  level: number = 0;
  zoneId: string = "";
  position: Vector2D = { x: 0, y: 0 };
  prevPosition: Vector2D = { x: 0, y: 0 };
  renderPosition: Vector2D = { x: 0, y: 0 };
  cameraWidth: number = 0;
  cameraHeight: number = 0;
  pendingActions: Array<{
    sequenceId: number;
    tick: number;
    action: ActionType;
    activeCommands: Set<CommandType>;
  }> = [];
  speed = 1;
  sequenceId: number = 0;

  constructor(character: CharacterRecord) {
    this.id = character.id ?? 0;
    this.playerId = character.playerId ?? 0;
    this.name = character.name ?? "";
    this.level = character.level ?? this.level;
    this.zoneId = character.zoneId ?? this.zoneId;
    this.position = {
      x: character.x ?? 0,
      y: character.y ?? 0,
    };
    this.prevPosition = {
      x: character.x ?? 0,
      y: character.y ?? 0,
    };
    this.cameraWidth = character.cameraWidth ?? 0;
    this.cameraHeight = character.cameraHeight ?? 0;
    this.renderPosition = { ...this.position };
    this.speed = character.speed ?? this.speed;
  }

  tick() {
    this.prevPosition.x = this.position.x;
    this.prevPosition.y = this.position.y;
  }

  move(velocity: { x: number; y: number }): void {
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }
}
