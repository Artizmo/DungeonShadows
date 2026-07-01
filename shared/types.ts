export interface ICharacter {
  id: number;
  name: string;
  isAlive: boolean;
  player: IPlayer;
  level: number;
  zone: IZone;
  position: ICoords;
  stats: IStats;
  sequenceId?: number;
  pendingActions?: IPendingAction<any>[];
  speed?: number;
}

export interface IWorld {
  character?: ICharacter;
  area?: IArea;
  _name?: string;
  areas?: Map<number, IArea>;
  charactersWithEvents?: Set<number>;
  _characters?: Map<number, ICharacter>;
}

export interface IGame {
  world: IWorld;
}

export interface IPlayer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface IArea {
  id: number;
  name: string;
  description: string;
  // zone: IZone;
  tick(tick: number): void;
}

export interface IStats {
  hp: number;
  maxHp: number;
}

export interface ICoords {
  x: number;
  y: number;
}

export interface IZone {
  id: string;
  areaId: string;
  mapPath: string;
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
  deltaTime?: number;
}

export interface IMovePayload {
  w: boolean;
  s: boolean;
  a: boolean;
  d: boolean;
}

export interface Config {
  cycleRate: number; // e.g., 0.05 (time increment step per update frame)
  tickRate: number; // e.g., 0.10 (time step per logical network tick)
  cycleSize: number; // e.g., 100000 (maximum bound wrapping constraint for tick ID)
}
