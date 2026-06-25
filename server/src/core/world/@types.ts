import type World from "./World";
import type Player from "../player/Player";
import type { Position } from "~/core/player/@types";
import type { Effect } from "~/_lib/effects/types";

export interface Locatable {
  position: Position;
  zoneMap: string;
}

export interface Effectable {
  effects: Map<string, Effect>;
  hasEffects: boolean;
}

export interface Actionable {
  pendingEvents: Array<any>;
  hasPendingEvents: boolean;
  addPendingEvent(event: any): void;
}

export interface WorldConfig {
  name: string;
  areas: {
    id: string;
    areaPath: string;
  }[];
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
