import { GameEventType, type PendingEvent } from "~/@types/events";
import type { Position, Stats } from "~/@types/game";
import type { Effect } from "~/lib/effects/types";
import type Player from "~/core/Player";

export default class Character {
  public id: number;
  public player: Player;
  public name: string;
  public level: number;
  public stats: Stats;
  public zoneMap: string;
  public position: Position;
  public displayX: number = 0;
  public displayY: number = 0;
  public inventory: string[] = [];
  public effects: Map<string, Effect> = new Map();
  public pendingEvents: Array<PendingEvent> = [];
  public lastProcessedInput: number = 0;
  public onPendingEvent?: (charId: number) => void;

  constructor(character: Character) {
    this.id = character.id;
    this.player = character.player;
    this.name = character.name;
    this.level = character.level;
    this.stats = { ...character.stats };
    this.position = character.position || { x: 0, y: 0 };
    this.displayX = character.position.x;
    this.displayY = character.position.y;
    this.inventory = [...character.inventory];
  }

  public get isDead(): boolean {
    return this.stats.hp <= 0;
  }

  public get getInventory(): string[] {
    return this.inventory;
  }

  public get hasPendingEvents(): boolean {
    return this.pendingEvents.length > 0;
  }

  public get hasActiveEffects(): boolean {
    return this.effects.size > 0;
  }

  public damage(amount: number): void {
    if (this.isDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.addPendingEvent({ type: GameEventType.DAMAGE, amount });

    if (this.stats.hp === 0) {
      this.addPendingEvent({ type: GameEventType.DEATH });
      this.effects.clear();
    }
  }

  public addEffect(effect: Effect): void {
    this.effects.set(effect.type, effect);
    this.addPendingEvent({ type: GameEventType.ADD_EFFECT });
  }

  public removeEffect(effect: Effect): void {
    this.effects.delete(effect.type);
    this.addPendingEvent({ type: GameEventType.REMOVE_EFFECT });
  }

  public addPendingEvent(event: PendingEvent): void {
    if (!event) return;

    this.pendingEvents.push(event);

    if (this.onPendingEvent) {
      this.onPendingEvent(this.id);
    }
  }

  public getCharacterSnapshot(): any | null {
    if (this.pendingEvents.length === 0) {
      return null;
    }

    // const snapshot = {
    //   id: this.id,
    //   ack: this.lastProcessedInput,
    //   events: [...this.pendingEvents],
    //   effects: Array.from(this.effects.values()).map((effect) => ({
    //     type: effect.type,
    //     duration: effect.duration,
    //     density: effect.density,
    //   })),
    // };
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
