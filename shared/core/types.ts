import type { IPendingAction } from "~/shared/types.js";
import type { GameProtocol } from "../network/generated/index.js";

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
  mapName: string;
}

export interface Config {
  cycleRate: number; // e.g., 0.05 (time increment step per update frame)
  tickRate: number; // e.g., 0.10 (time step per logical network tick)
  cycleSize: number; // e.g., 100000 (maximum bound wrapping constraint for tick ID)
}

interface GameConfig {
  readonly SPEED: number;
  readonly SERVER_TICK_RATE: number;
  readonly CLIENT_TICK_RATE: number;
  readonly INTERPOLATION_DELAY: number;
}

const GAME_CONFIG: GameConfig = {
  SPEED: 200,
  SERVER_TICK_RATE: 1000 / 20, // 20Hz
  CLIENT_TICK_RATE: 1000 / 60, // 60Hz fixed
  INTERPOLATION_DELAY: 100,
};

enum ActionType {
  MOVE = 1,
  CAST = 2,
}

export interface ActionPayload {
  x?: number;
  y?: number;
  targetId?: string;
}

export interface ActionRecord {
  sequenceId: number;
  type: GameProtocol.ActionType;
  payload: ActionPayload;
  dt: number;
}

export interface EntityState {
  x: number;
  y: number;
  mana: number;
  health: number;
  areaId: string | null;
  zoneId: string | null;
}

export interface Snapshot {
  type: string;
  serverTime: number;
  entitiesDelta: Record<string, EntityState>;
  lastProcessedId: number;
}
