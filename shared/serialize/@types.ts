export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export interface IPlayer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ICharacter {
  id: number;
  name: string;
  isAlive: boolean;
  player: IPlayer;
  level: number;
  zone: Zone;
  position: Position;
  stats: Stats;
}

export type Character = {
  id: number;
  name: string;
  level: number;
  player: Player;
  zone: Zone;
  isAlive: boolean;
  position: Position;
  stats: Stats;
};

export interface Stats {
  hp: number;
  maxHp: number;
}

export type Position = {
  x: number;
  y: number;
};

export type Zone = {
  id: string;
  areaId: string;
  mapPath: string;
};

export enum OpCode {
  CHARACTER_SPAWN = 0,
  MAP_CHUNK = 1,
  CLIENT_BATCH_INPUT = 2,
  WORLD_STATE_UPDATE = 3,
  MOVE = 4,
}

export interface IMapChunkData {
  x: number;
  y: number;
  imageBytes: Uint8Array;
}

export enum GameEventType {
  DAMAGE = "DAMAGE",
  ADD_EFFECT = "ADD_EFFECT",
  REMOVE_EFFECT = "REMOVE_EFFECT",
  DEATH = "DEATH",
  CHARACTER = "CHARACTER",
  MOVE = "MOVE",
}

export type MoveEvent = {
  type: GameEventType.MOVE;
  characterId: number;
  x: number;
  y: number;
  lastProcessedId: number;
};

export type ActionType = "MOVE";

export interface IPendingAction<T = any> {
  type: ActionType;
  sequenceId: number;
  payload: T;
}

export interface IMovePayload {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
}
