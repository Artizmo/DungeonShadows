// State flags
export const enum BaseFlags {
  NONE = 0,
  SPAWNED = 1 << 0,
  DESPAWNED = 1 << 1,
  POSITION = 1 << 2,
  ROTATION = 1 << 3,
}

export const enum EntityFlags {
  NONE = BaseFlags.NONE,
  SPAWNED = BaseFlags.SPAWNED,
  DESPAWNED = BaseFlags.DESPAWNED,
  POSITION = BaseFlags.POSITION,
  ROTATION = BaseFlags.ROTATION,
}

export const enum ItemFlags {
  NONE = BaseFlags.NONE,
  SPAWNED = BaseFlags.SPAWNED,
  DESPAWNED = BaseFlags.DESPAWNED,
  POSITION = BaseFlags.POSITION,
  ROTATION = BaseFlags.ROTATION,
}

export const enum StructureFlags {
  NONE = BaseFlags.NONE,
  SPAWNED = BaseFlags.SPAWNED,
  DESPAWNED = BaseFlags.DESPAWNED,
  POSITION = BaseFlags.POSITION,
}

export const enum ChunkFlags {
  NONE = BaseFlags.NONE,
  CHUNK = 1 << 0,
  UNCHUNK = 1 << 1,
}

// Data interfaces
export interface CharacterRecord {
  id: number;
  name: string;
  level: number;
  speed: number;
  areaId: string;
  zoneId: string;
  rotation: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

// World interfaces
export interface IWorld {}

export enum ActionType {
  GAME = 0,
  CONNECT = 1,
  DISCONNECT = 2,
  MOVE = 3,
  CAST = 4,
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

export interface ICamera {
  width: number;
  height: number;
}

// Entity interfaces
export interface Entity {
  id: number;
  name: string;
  level: number;
  speed: number;
  zoneId: string;
  transform: Transform2D;
  width: number;
  height: number;
  sequenceId?: number;
  move(velocity: Vector2D): void;
}

export enum EntityType {
  CHARACTER,
  NPC,
  ITEM,
  STRUCTURE,
}

export interface Transform2D {
  position?: Vector2D; // x, y
  rotation?: number; // radians
}

export interface Vector2D {
  x: number;
  y: number;
}

// Zone interfaces
export type Act = (entity: Entity, world: IWorld, tickRate: number) => void;

export interface Bucket {
  id: string;
  entities: Entity[];
}

export interface IZone {
  id: string;
  areaId: string;
  name: string;
  description: string;
  author: string;
  publishedDate: Date;
}

// Network Interfaces
export interface ClientContext {
  characterId: number;
  playerId: number;
  camera: ICamera;
}
export interface QueueItem {
  tick: number;
  bytes: Uint8Array;
}

export enum PacketCategory {
  SYSTEM = 0,
  API = 1,
  SNAPSHOT = 2,
  COMM = 3,
}

// Core interfaces
export interface GameConfig {
  frameRate: number;
  frameSize: number;
  interpolationDelay: number;
  speed: number;
  tickRate: number;
}
