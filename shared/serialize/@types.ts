export type Player = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
};

export type Character = {
  id: number;
  name: string;
  level: number;
  player: Player;
  zone: Zone;
  isAlive: boolean;
  position: Position;
};

export type Position = {
  x: number;
  y: number;
};

export type Zone = {
  id: string;
  areaId: string;
  mapName: string;
};

export enum OpCode {
  CHARACTER_SPAWN = 0,
  MAP_CHUNK = 1,
}

export interface IMapChunkData {
  x: number;
  y: number;
  imageBytes: Uint8Array;
}
