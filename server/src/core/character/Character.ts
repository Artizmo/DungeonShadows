import { EventEmitter } from "events";
import { type PendingEvent } from "~/core/game/@types";
import type { Position, Stats } from "~/core/character/@types";
import type { Effect } from "~/_lib/effects/types";
import type Player from "~/core/character/Player";

export default class Character {
  public static events: EventEmitter = new EventEmitter();
  public id: number;
  public player: Player;
  public name: string;
  public level: number;
  public stats: Stats;
  public zoneMap: string;
  public position: Position;
  public inventory: string[] = [];
  public effects: Map<string, Effect> = new Map();
  public pendingEvents: Array<PendingEvent> = [];

  constructor(character: Character) {
    this.id = character.id;
    this.player = character.player;
    this.name = character.name;
    this.level = character.level;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.inventory = [...character.inventory];
    this.zoneMap = character.zoneMap;
  }

  public get hasPendingEvents(): boolean {
    return this.pendingEvents.length > 0;
  }

  public get hasEffects(): boolean {
    return this.effects.size > 0;
  }

  public addPendingEvent(event: PendingEvent): void {
    if (!event) return;

    this.pendingEvents.push(event);

    Character.events.emit("eventAdded", this.id);
  }

  public getCharacterSnapshot(): any | null {
    if (this.pendingEvents.length === 0) {
      return null;
    }

    const snapshot = {
      id: this.id,
      name: this.name,
      level: this.level,
      position: { ...this.position },
    };
    this.pendingEvents = [];

    return snapshot;
  }

  public tick(_tick: number): void {}
  public update(_tick: number): void {}
}
