export type Player = {
  id: number;
  fullName: string;
};

export type Character = {
  id: number;
  name: string;
  player: Player;
  zoneMap: string;
  isAlive: boolean;
};

export enum OpCode {
  CHARACTER_SPAWN = 0,
}
