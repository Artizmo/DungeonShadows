import Game from "./Game";

// Define the incoming state interfaces based on your server contracts
export interface Vector3D {
  x: number;
  y: number;
  z: number;
}
export interface CoordinateState extends Vector3D {
  isWalkable: boolean;
  blocksSight: boolean;
  elevation: number;
  environment: "INDOOR" | "OUTDOOR";
}

export class World {
  public game: Game;
  public pendingActions: Array<{ tick: number; action: any }> = [];

  // Zone Data
  public currentZoneId = "unloaded";
  public gridWidth = 0;
  public gridHeight = 0;
  public matrix: CoordinateState[][][] = []; // [Z][X][Y]

  // Graphics Data
  public mapImage: HTMLImageElement | null = null;
  public isImageLoaded = false;

  // The state passed to the Renderer every frame
  public renderState = {
    matrix: [] as CoordinateState[][][],
    mapImage: null as HTMLImageElement | null,
    currentZLevel: 0, // The floor the player is currently viewing
  };

  constructor(game: Game) {
    this.game = game;
  }

  public queueAction(type: string, payload: { x: number; y: number }): void {
    const tick = this.game.loop.tickCounter; // Use current engine tick

    // 1. PREDICT: Move locally immediately for 0ms latency feel
    if (this.game.character) {
      this.game.character.position.x += payload.x;
      this.game.character.position.y += payload.y;
    }

    // 2. BUFFER: Store for potential reconciliation
    const action = { type, payload, tick };
    this.pendingActions.push({ tick, action });

    // 3. SEND: To server
    this.game.send("MOVE_REQUEST", action);
  }

  public reconcile(
    serverTick: number,
    authoritativePos: { x: number; y: number },
  ): void {
    if (!this.game.character) return;

    // 1. Calculate how far off the client is from the server
    const dx = Math.abs(this.game.character.position.x - authoritativePos.x);
    const dy = Math.abs(this.game.character.position.y - authoritativePos.y);

    // 2. Only reconcile if the drift is significant (e.g., > 0.5 tiles)
    // This prevents jitter from tiny floating point errors.
    const driftThreshold = 0.5;
    if (dx > driftThreshold || dy > driftThreshold) {
      // Instead of snapping, we move the position toward the server pos
      // by a fraction, or we snap only if the drift is massive.
      // For now, let's keep the snap, but we will fix the 'replay' logic.
      this.game.character.position.x = authoritativePos.x;
      this.game.character.position.y = authoritativePos.y;

      // 3. Replay with a 'smoothing' factor
      this.pendingActions = this.pendingActions.filter(
        (a) => a.tick > serverTick,
      );

      for (const pending of this.pendingActions) {
        // Apply only a portion of the replay if you want to avoid 'teleporting'
        // Or, simply accept the snap but ensure interpolation is handling the visual
        this.game.character.position.x += pending.action.payload.x;
        this.game.character.position.y += pending.action.payload.y;
      }
    }
  }

  public update(tick: number): void {
    // 🎯 Move the render call here so it updates fluidly every single frame
    this.game.renderer?.render();
  }

  public tick(tick: number): void {
    // Leave this clear or restricted purely to fixed physics step network checks
    this.game.character?.tick();
  }

  public clear(): void {
    this.matrix = [];
    this.mapImage = null;
    this.isImageLoaded = false;
    this.currentZoneId = "unloaded";
  }
}
