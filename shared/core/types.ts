export interface StateRecord {
  sequenceId: number;
  tick: number;
  actions: Set<ActionType>;
  state: WorldState;
}

export interface WorldState {
  character?: {
    stats?: {
      hp: number;
      maxHp: number;
      mana: number;
      maxMana: number;
    };
    position?: {
      x: number;
      y: number;
    };
  };
}

export interface ICoords {
  x: number;
  y: number;
}

export interface QueueItem {
  tick: number;
  bytes: Uint8Array;
}

export enum PacketCategory {
  SYSTEM = 0,
  ACTION = 1,
  SNAPSHOT = 2,
  COMM = 3,
}

export enum ActionType {
  GAME = 0,
  MOVE = 1,
  CAST = 2,
  JOIN = 3,
  LEAVE = 4,
  ZONE_UPDATE = 5,
}

export interface ActionPayload {
  characterId: number;
  sequenceId: number;
  data: any;
}

export interface ActionRecord {
  sequenceId: number;
  type: ActionType;
  payload: ActionPayload;
  dt: number;
}

export interface GameConfig {
  frameRate: number;
  frameSize: number;
  interpolationDelay: number;
  speed: number;
  tickRate: number;
}
