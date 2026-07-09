import type {
  ActionRecord,
  GameEntity,
  ICoords,
  IStats,
  IZone,
} from "~/shared/core/types";

export default class Character implements GameEntity {
  id: number;
  playerId: number;
  name: string;
  level: number;
  zone: IZone;
  position: ICoords;
  renderPosition: ICoords;
  stats: IStats;
  isAlive: boolean;
  pendingActions: ActionRecord[] = [];
  speed: number = 3.6;
  sequenceId: number = 0;
  lastProcessedSequenceId = 0;

  constructor(character: Character) {
    this.id = character.id;
    this.playerId = character.playerId;
    this.name = character.name;
    this.level = character.level;
    this.zone = { ...character.zone };
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.renderPosition = { ...this.position };
  }
}
