import type World from "../core/World";
import type Player from "../core/Player";

export type WorldConfig = {
  name: string;
  areas: { id: string; manifestPath: string }[];
};

export type SavedCharacter = {
  id: number;
  pid: number;
  name: string;
  level: number;
  health: {
    hp: number;
    max: number;
  };
  x: number;
  y: number;
  area: {
    id: number;
  };
};

export interface ClientInputPayload {
  cid: number;
  command: string;
  data: any;
}

export interface CommandContext {
  world: World;
  player: Player;
  characterId: number;
}

export interface ColliderBase {
  id?: string;
  type: "POLYGON" | "CIRCLE";
}

export interface PolygonCollider extends ColliderBase {
  type: "POLYGON";
  vertices: [number, number][];
}

export interface CircleCollider extends ColliderBase {
  type: "CIRCLE";
  center: [number, number];
  radius: number;
}

export type Collider = PolygonCollider | CircleCollider;

export interface ZoneItem {
  id: string;
  name: string;
  x: number;
  y: number;
  colliders: Collider[];
}

export interface ZoneData {
  id: string;
  parentAreaId: string;
  name: string;
  map: {
    width: number;
    height: number;
    file: string;
  };
  colliders: Collider[];
  items: ZoneItem[];
}

export interface Area {
  id: number;
  name: string;
  description: string;
  zones: Map<string, ZoneData>;
}

// Represents the decoupled root index configuration file (world.json)
export interface WorldConfigFile {
  name: string;
  areas: {
    id: string;
    manifestPath: string;
  }[];
}
