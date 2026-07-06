import type { GameProtocol } from "../network/generated/index.js";

export interface GameConfig {
  readonly SPEED: number;
  readonly SERVER_TICK_RATE: number;
  readonly CLIENT_TICK_RATE: number;
  readonly INTERPOLATION_DELAY: number;
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
  lastProcessedIds: Record<string, number>; // Maps character ID to their last processed sequence ID
}

export interface NetworkEnvelope {
  connectionId: string;
  packet: ActionRecord;
}

export interface ClientTransport {
  send(packet: ActionRecord): void;
  onReceive(handler: (snapshot: Snapshot) => void): void;
}

export interface ServerTransport {
  broadcast(snapshot: Snapshot): void;
  onReceive(
    handler: (connectionId: string, packet: ActionRecord) => void,
  ): void;
}

export interface GameEntity {
  id: string;
  x: number;
  y: number;
  health: number;
  mana: number;
  areaId: string | null;
  zoneId: string | null;
  angle?: number;
  lastCastTimestamp?: number;
}

export interface IWorld {
  get(id: string): GameEntity | undefined;
  markDirty(id: string): void;
}

export interface ActionHandler {
  validate?(
    entity: GameEntity,
    payload: ActionPayload,
    dt: number,
    world: IWorld,
  ): boolean;
  execute(
    entity: GameEntity,
    payload: ActionPayload,
    dt: number,
    world: IWorld,
  ): void;
  update(
    entity: GameEntity,
    payload: ActionPayload,
    dt: number,
    world: IWorld,
  ): void;
  reconcile(
    entity: GameEntity,
    payload: ActionPayload,
    dt: number,
    world: IWorld,
  ): void;
}

export interface CommandResult<T = any> {
  isLocal: boolean;
  type?: GameProtocol.ActionType;
  payload?: ActionPayload;
  execute?: (game: T) => void;
}
