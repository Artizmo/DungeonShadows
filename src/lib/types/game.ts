import type GameEventsType from "../classes/GameEvents";

export type GameEventListeners = Map<string, (arg: any) => void>;

export type GameEvents = GameEventsType;