import type InputHandler from "../InputHandler";
import type {
  IPendingAction,
  ICharacter,
  IPlayer,
  IZone,
  ICoords,
  IStats,
} from "~/shared/types";

export default class Character implements ICharacter {
  public id: number;
  public player: IPlayer;
  public name: string;
  public level: number;
  public zone: IZone;
  public position: ICoords;
  public renderPosition: ICoords;
  public stats: IStats;
  public isAlive: boolean;
  public pendingActions: IPendingAction<any>[] = [];
  public speed: number = 3.6;
  private sequenceId: number = 0;
  private LERP_FACTOR: number = 0.65;
  private readonly FIXED_DELTA_TIME: number = 1 / 60;

  constructor(character: ICharacter) {
    this.id = character.id;
    this.player = { ...character.player };
    this.name = character.name;
    this.level = character.level;
    this.zone = { ...character.zone };
    this.isAlive = character.isAlive;
    this.stats = { ...character.stats };
    this.position = { ...character.position };
    this.renderPosition = { ...this.position };
  }

  /**
   * 🟢 INPUT SAMPLING (Called from your high-Hz Client Update loop)
   */
  public handleInputMovement(input: InputHandler): void {
    // Safety check: ensure input and input.keys exist
    if (!input || !input.keys) return;

    const isMoving =
      input.keys.w || input.keys.s || input.keys.a || input.keys.d;
    if (!isMoving) return;

    this.sequenceId++;

    // 🟢 Build a completely flat payload object explicitly
    const action: IPendingAction<any> = {
      type: "MOVE",
      sequenceId: this.sequenceId,
      payload: {
        w: !!input.keys.w,
        s: !!input.keys.s,
        a: !!input.keys.a,
        d: !!input.keys.d,
        dt: this.FIXED_DELTA_TIME,
      },
    };

    // 1. Queue it for network transmission
    this.pendingActions.push(action);

    // 2. Predict it locally (Phase 1)
    this.applyPhysics(action.payload);
  }

  /**
   * 🟢 PHASE 5: SERVER RECONCILIATION
   */
  public reconcile(x: number, y: number, lastSequence: number): void {
    // 1. Hard Override with Server Ground Truth
    this.position.x = x;
    this.position.y = y;

    // 2. The O(1) Pluck
    while (
      this.pendingActions.length > 0 &&
      this.pendingActions[0].sequenceId <= lastSequence
    ) {
      this.pendingActions.shift();
    }

    // 3. Re-Simulation Pass
    for (const action of this.pendingActions) {
      // Each unacknowledged input is re-simulated using its saved structural delta step
      this.applyPhysics(action.payload);
    }
  }

  /**
   * 🟢 PHASE 6: SMOOTH RENDERING TICK
   */
  public updateVisuals(): void {
    // Smoothly slide visual coordinates toward the logical ground truth
    this.renderPosition.x +=
      (this.position.x - this.renderPosition.x) * this.LERP_FACTOR;
    this.renderPosition.y +=
      (this.position.y - this.renderPosition.y) * this.LERP_FACTOR;

    // Prevent micro-float precision decay
    if (Math.abs(this.position.x - this.renderPosition.x) < 0.001)
      this.renderPosition.x = this.position.x;
    if (Math.abs(this.position.y - this.renderPosition.y) < 0.001)
      this.renderPosition.y = this.position.y;
  }

  /**
   * 🟢 DETERMINISTIC PHYSICS ENGINE
   * Scales movement based explicitly on the embedded time slice delta.
   */
  private applyPhysics(
    payload: {
      w: boolean;
      s: boolean;
      a: boolean;
      d: boolean;
      dt: number;
    } = { w: false, s: false, a: false, d: false, dt: 1 / 60 },
  ): void {
    // Fallback safety layer to intercept undefined calls
    const safePayload = payload || {
      w: false,
      s: false,
      a: false,
      d: false,
      dt: 1 / 60,
    };
    const { w, s, a, d, dt } = safePayload;

    // Calculate precise displacement distance for this specific time slice
    const distance = this.speed * dt;

    if (w) this.position.y -= distance;
    if (s) this.position.y += distance;
    if (a) this.position.x -= distance;
    if (d) this.position.x += distance;

    // Strict precision lock
    this.position.x = Math.round(this.position.x * 100) / 100;
    this.position.y = Math.round(this.position.y * 100) / 100;
  }

  public tick(tick: number) {}
}
