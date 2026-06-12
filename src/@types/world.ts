import type GameWorld from '../core/World';
import type Player from '../core/Player';

export type SavedWorld = {
  name: string
  areas: Map<number, Area>
};

export type SavedCharacter = {
  id: number
  pid: number
  name: string
  level: number
  health: {
    hp: number
    max: number
  }
  x: number
  y: number
  area: {
    id: number
  }
};

export type Area = {
  id: number
  name: string
  createDate: Date
  modifiedDate: Date
  author: string
  // acts: Map<number, Act>
  // zones: Map<number, Zone>
  // npcs: Map<number, NPC>
  // items: Map<number, Item>
}

export interface ClientInputPayload {
  cid: number;
  command: string;
  data: any;
}

export interface CommandContext {
  world: GameWorld;
  player: Player;
  characterId: number;
}