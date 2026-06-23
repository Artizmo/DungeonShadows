import type {
  Config,
  Response,
  IResponseHandler,
  GameEvent,
  GameListener,
} from "~/types/game";
import { Client } from "~/core/Client";
import { Loop } from "~/core/Loop";
import { World } from "~/core/World";
import Renderer from "~/core/Renderer";
import Character from "~/core/Character";
import { RESPONSE_REGISTRY } from "~/lib/responses";
import InputHandler from "~/core/InputHandler";

export default class Game {
  public readonly config: Config;
  public readonly loop: Loop;
  public character: Character | null = null;
  public client: Client | null = null;
  public world: World | null = null;
  public input: InputHandler | null = null;
  public renderer: Renderer | null = null;
  public isReady = false;
  private readonly responseHandlers: Map<string, IResponseHandler> = new Map();

  private listeners: Map<GameEvent, Set<GameListener>> = new Map();

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(config, this);
    this.registerResponseHandlers();
  }

  private registerResponseHandlers(): void {
    for (const [trigger, ResponseClass] of Object.entries(RESPONSE_REGISTRY)) {
      this.responseHandlers.set(trigger, new ResponseClass());
    }
  }

  /**
   * 🚀 Boots the game engine utilizing a secure single-use ticket string
   */
  public async start(ticket: string): Promise<void> {
    this.world = new World(this);
    this.client = new Client(this);
    this.character = new Character({
      id: this.client.characterId,
    } as Character);
    this.input = new InputHandler();
    this.isReady = true;

    // 1. Pass the secure token directly down into the client instance setup
    // Client will decode it locally to populate this.client.playerId & characterId
    this.client.connect(ticket);

    this.loop.start();
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.renderer = new Renderer(canvas, this);
  }

  // 🎯 EVENT EMITTER SUBSCRIPTION METHOD
  public subscribe(event: GameEvent, callback: GameListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return an un-subscription teardown function cleanly
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // 🎯 EVENT EMITTER DISPATCH METHOD
  public emit(event: GameEvent): void {
    const targets = this.listeners.get(event);
    if (!targets) return;
    targets.forEach((callback) => callback(this));
  }

  public async routeResponses(response: Response): Promise<void> {
    if (!this.isReady || !this.character) return;

    const { character } = this;
    const handler = this.responseHandlers.get(response.type);

    if (!handler) {
      console.log(`No message handler found for: ${response.type}`);
      return;
    }

    try {
      await handler.execute({
        character,
        game: this,
        data: response.data,
      });
    } catch (e) {
      console.log(`Error executing handler: ${e}`);
    }
  }

  public send(type: string, data: any): void {
    if (!this.client) return;

    this.client.send(type, data);
  }

  public update(tick: number): void {
    if (!this.isReady || !this.world || !this.character) return;

    // 1. Calculate time-scaled interpolation using the FIXED simulation step
    // Using this.config.cycleRate guarantees deterministic smoothing across devices
    const speed = 10;
    const lerpFactor = 1 - Math.exp(-speed * this.config.cycleRate);

    // 2. Apply interpolation safely inside the fixed loop
    this.character.displayX +=
      (this.character.position.x - this.character.displayX) * lerpFactor;
    this.character.displayY +=
      (this.character.position.y - this.character.displayY) * lerpFactor;

    // 3. Trigger world logic
    this.world.update(tick);
    this.emit("WORLD_UPDATED");
  }

  public tick(tick: number): void {
    if (!this.isReady || !this.world || !this.character || !this.input) return;

    // 1. Calculate direction vector from currently held keys
    let dx = 0;
    let dy = 0;

    if (this.input.keys.w) dy -= 1;
    if (this.input.keys.s) dy += 1;
    if (this.input.keys.a) dx -= 1;
    if (this.input.keys.d) dx += 1;

    // 2. If the user is pressing a key, apply movement velocity per tick
    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal velocity so moving diagonally isn't faster
      const length = Math.sqrt(dx * dx + dy * dy);
      const speedPerTick = 0.2; // Moves 15% of a tile per server tick

      const velocity = {
        x: (dx / length) * speedPerTick,
        y: (dy / length) * speedPerTick,
      };

      // Pass the fine-grained sub-tile movement to your action queue
      this.world.queueAction("MOVE", velocity);
    }

    this.world.tick(tick);
    this.emit("CHARACTER_UPDATED");
  }

  public shutdown(): void {
    if (!this.client) return;

    this.isReady = false;
    this.loop.stop();
    this.client.disconnect();

    if (this.world) {
      this.world.clear();
    }
    this.renderer = null;
    console.log("🛑 Game Engine core successfully shut down.");
  }
}
