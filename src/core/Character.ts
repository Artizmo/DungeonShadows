import type { Position, Stats } from '~/@types/game';
import type { CharacterRecord } from '~/data/mock/mock';
import type { ActiveEffect } from "~/core/EffectsManager";
import Logger from './Logger';

export default class Character {
  public id: number;
  public ownerPlayerId: number | null;
  public name: string;
  public position: Position;
  public stats: Stats;
  public inventory: string[] = [];
  public activeEffects: Map<string, ActiveEffect > = new Map();
  public pendingEvents: Array<{ type: string; amount?: number }> = [];
  public lastProcessedInput: number = 0;
  logger: Logger = new Logger("CHAR");

  constructor(characterRecord: CharacterRecord) {
    this.id = characterRecord.id;
    this.name = characterRecord.name;
    this.ownerPlayerId = characterRecord.playerId;
    this.stats = { ...characterRecord.stats };
    this.position = characterRecord.position || { x: 0, y: 0 };
    this.inventory = [...characterRecord.inventory];
  }

  public get isDead(): boolean {
    return this.stats.hp <= 0;
  }

  public getInventory(): string[] {
    return this.inventory;
  }

  public heal(amount: number): void {
    if (this.isDead) return;
    if (this.stats.hp === this.stats.maxHp) return;

    const oldHp = this.stats.hp;
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);

    if (this.stats.hp > oldHp) {
      this.pendingEvents.push({ type: "HEAL", amount: this.stats.hp - oldHp });
    }
  }

  public damage(amount: number): void {
    if (this.isDead) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.pendingEvents.push({ type: "DAMAGE", amount });

    if (this.stats.hp === 0) {
      this.pendingEvents.push({ type: "DEATH" });
      this.activeEffects.clear();
    }
  }

  public addAffect(effect): void {

  }

  public getCharacterSnapshot(): any | null {
    if (this.pendingEvents.length === 0) {
      return null;
    }

    const snapshot = {
      id: this.id,
      ack: this.lastProcessedInput,
      events: [...this.pendingEvents]
    };

    this.pendingEvents = [];
    return snapshot;
  }

  public get hasPendingEvents(): boolean {
    const hasPendingEvents = this.pendingEvents.length > 0;
    const hasActiveEffects = this.activeEffects.size > 0;

    return hasPendingEvents || hasActiveEffects;
  }

  public tick(tick: number): void {

  }

  public update(tick: number): void {
  }

}