import type { Effect, Position, Stats } from "~/core/character/@types";
import Player from "~/core/character/Player";
import type Zone from "../world/Zone";
import type InputHandler from "../InputHandler";
import type {
  IPendingAction,
  IPlayer,
  MoveEvent,
} from "~/shared/serialize/@types";

export interface ICharacter {
  id: number;
  name: string;
  isAlive: boolean;
  player: IPlayer;
  level: number;
  zone: Zone;
  position: Position;
  stats: Stats;
}

export default class Character implements ICharacter {
  public id: number;
  public player: Player;
  public name: string;
  public level: number;
  public zone: Zone;
  public position: Position;
  public stats: Stats;
  public isAlive: boolean;
  public effects: Map<string, Effect> = new Map();
  public pendingActions: IPendingAction<any>[] = [];
  public speed: number = 0.06;
  private sequenceId: number = 0;

  // 🟢 PHASE 6 VISUAL STATE PROPERTIES
  public renderX: number;
  public renderY: number;
  private LERP_FACTOR: number = 0.65; // Speed of visual catch-up (0.15 - 0.30 is butter)

  constructor(character: ICharacter) {
    this.id = character.id;
    this.player = new Player(character.player);
    this.name = character.name;
    this.level = character.level;
    this.zone = character.zone;
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };

    // 🟢 Initialize render positions to match logical coordinates instantly on spawn
    this.renderX = this.position.x;
    this.renderY = this.position.y;
  }

  public handleInputMovement(input: InputHandler): void {
    const isMoving =
      input.keys.w || input.keys.s || input.keys.a || input.keys.d;
    if (!isMoving) return;

    this.sequenceId++;

    const action: IPendingAction<any> = {
      type: "MOVE",
      sequenceId: this.sequenceId,
      payload: { ...input.keys },
    };

    // 1. Queue it for Phase 2 transmission
    this.pendingActions.push(action);

    // 2. Predict it locally (Phase 1)
    this.applyPhysics(action.payload);
  }

  /**
   * 🟢 PHASE 5: SERVER RECONCILIATION
   * Call this immediately inside your network handler when the deserializer outputs 'bingo world'
   */
  public reconcile(serverUpdates: MoveEvent[]): void {
    const myUpdate = serverUpdates.find(
      (event) => event.characterId === this.id,
    );
    if (!myUpdate) return;

    // 1. Ground Truth Override (Snap logical state)
    this.position.x = myUpdate.x;
    this.position.y = myUpdate.y;

    // 2. The O(A) Pluck
    const serverLastProcessedId = myUpdate.lastProcessedId;
    while (
      this.pendingActions.length > 0 &&
      this.pendingActions[0].sequenceId <= serverLastProcessedId
    ) {
      this.pendingActions.shift();
    }

    // 3. Re-Simulation Pass
    for (const action of this.pendingActions) {
      this.applyPhysics(action.payload);
    }
  }

  /**
   * 🟢 PHASE 6: SMOOTH RENDERING TICK
   * Run this inside your 60Hz RequestAnimationFrame loop (Game.update)
   */
  public updateVisuals(deltaTime: number): void {
    // Smoothly slide visual coordinates toward the logical ground truth
    this.renderX += (this.position.x - this.renderX) * this.LERP_FACTOR;
    this.renderY += (this.position.y - this.renderY) * this.LERP_FACTOR;

    // Prevent micro-float precision decay
    if (Math.abs(this.position.x - this.renderX) < 0.001)
      this.renderX = this.position.x;
    if (Math.abs(this.position.y - this.renderY) < 0.001)
      this.renderY = this.position.y;
  }

  /**
   * Shared isolated physics applicator used for standard prediction and re-simulation paths
   */
  private applyPhysics(keys: {
    w: boolean;
    s: boolean;
    a: boolean;
    d: boolean;
  }): void {
    if (keys.w) this.position.y -= this.speed;
    if (keys.s) this.position.y += this.speed;
    if (keys.a) this.position.x -= this.speed;
    if (keys.d) this.position.x += this.speed;
  }

  public tick(tick: number) {}
}
