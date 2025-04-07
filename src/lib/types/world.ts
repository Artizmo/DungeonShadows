import type Area from "../classes/Area";

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