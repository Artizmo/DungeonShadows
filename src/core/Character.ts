import { GameEventType, type PendingEvent } from '~/@types/events';
import type { Position, Stats } from '~/@types/game';
import type { CharacterRecord } from 'data/mock/mock';
import type Player from './Player';
import type { ActiveEffect } from '~/@types/effects';
import Log from './Logger';
import EffectsManager from '~/core/EffectsManager';

export default class Character {
  public id: number;
  public player: Player;
  public name: string;
  public position: Position;
  public stats: Stats;
  public inventory: string[] = [];
  public activeEffects: Map<string, ActiveEffect > = new Map();
  public pendingEvents: Array<PendingEvent> = [];;
  public lastProcessedInput: number = 0;
  public onAppliedEffect?: (charId: number) => void;

  constructor(characterRecord: CharacterRecord) {
    this.id = characterRecord.id;
    this.name = characterRecord.name;
    this.stats = { ...characterRecord.stats };
    this.position = characterRecord.position || { x: 0, y: 0 };
    this.inventory = [...characterRecord.inventory];
  }

  public set setPlayer(player: Player) {
    this.player = player;
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
    return this.activeEffects.size > 0;
  }

  public damage(amount: number): void {
    if (this.isDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.pendingEvents.push({ type: GameEventType.DAMAGE, amount });

    if (this.stats.hp === 0) {
      this.pendingEvents.push({ type: GameEventType.DEATH });
      this.activeEffects.clear();
    }
  }

  public applyEffect(effect: ActiveEffect): void {
    EffectsManager.apply(this, effect);

    if (this.onAppliedEffect) {
      this.onAppliedEffect(this.id);
    }
  }

  public getCharacterSnapshot(): any | null {
    if (this.pendingEvents.length === 0) {
      return null;
    }

    const snapshot = {
      id: this.id,
      ack: this.lastProcessedInput,
      events: [...this.pendingEvents],
      effects: Array.from(this.activeEffects.values()).map(effect => ({
        type: effect.type,
        duration: effect.duration,
        density: effect.density
      }))
    };

    this.pendingEvents = [];
    return snapshot;
  }

  public tick(tick: number): void {

  }

  public update(tick: number): void {
  }

}