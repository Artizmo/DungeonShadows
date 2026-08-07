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

export enum ZoneFlags {
  NONE = BaseFlags.NONE,
  ZONED = 1 << 1,
  CHUNK = 1 << 2,
  UNCHUNK = 1 << 3,
  WEATHER = 1 << 4, // Rain, snow, fog changes
  DAY_NIGHT = 1 << 5, // Lighting / time-of-day progression
  EFFECTS = 1 << 6, // Zone-wide buffs/debuffs or gravity modifiers
}

// Data interfaces
export interface CharacterRecord {
  id?: number;
  name?: string;
  playerId?: number;
  level?: number;
  speed?: number;
  areaId?: string;
  zoneId?: string;
  rotation?: number;
  width?: number;
  height?: number;
  cameraWidth?: number;
  cameraHeight?: number;
  x?: number;
  y?: number;
}

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
export type Act = (
  entity: Entity,
  world: IServerWorld,
  tickRate: number
) => void;

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

// Input & Network Interfaces
export enum CommandType {
  MOVE_UP = "MOVE_UP",
  MOVE_DOWN = "MOVE_DOWN",
  MOVE_LEFT = "MOVE_LEFT",
  MOVE_RIGHT = "MOVE_RIGHT",
  CAST_SPELL = "CAST_SPELL",
  MENU_TOGGLE = "MENU_TOGGLE",
  UI_UP = "UI_UP",
  UI_DOWN = "UI_DOWN",
  UI_SELECT = "UI_SELECT",
}

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

// Character interfaces
export interface IClientCharacter {
  transform: {
    position: Vector2D;
    rotation: number;
  };
  zoneId: string;
  move(velocity: { x: number; y: number }): void;
  speed: number;
}
export interface IServerCharacter {}

// World interfaces
export interface IClientWorld {
  zoneManager: any;
  character: IClientCharacter;
}

export interface IServerWorld {}

export interface IClientGame {
  world: IClientWorld;
}

export interface IServerGame {
  world: IServerWorld;
}

export interface GameConfig {
  frameRate: number;
  frameSize: number;
  interpolationDelay: number;
  speed: number;
  tickRate: number;
}
