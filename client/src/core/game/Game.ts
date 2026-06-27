// client/src/core/game/Game.ts
import EventEmitter from "eventemitter3";
import { Log } from "~/shared/core/Logger";
import { Client } from "~/core/game/Client";
import { Loop } from "~/core/game/Loop";
import { World } from "~/core/world/World";
import Renderer from "~/core/Renderer";
import type Character from "~/core/character/Character";
import InputHandler from "~/core/InputHandler";
import type { Config, Response, IResponseHandler } from "~/core/game/@types";
import { RESPONSE_REGISTRY } from "~/_lib/responses";
import Camera from "../Camera";

export default class Game {
  public events: EventEmitter = new EventEmitter();
  public readonly config: Config;
  public readonly loop: Loop;
  public client!: Client;
  public world!: World;
  public camera!: Camera;
  public input!: InputHandler;
  public renderer!: Renderer;
  public isReady = false;

  // Viewport tracking camera metrics
  public cameraX = 0;
  public cameraY = 0;

  private readonly TILE_SIZE = 32;
  private readonly responseHandlers: Map<string, IResponseHandler> = new Map();

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(config);
    this.registerResponseHandlers();
  }

  private registerResponseHandlers(): void {
    for (const [trigger, ResponseClass] of Object.entries(RESPONSE_REGISTRY)) {
      this.responseHandlers.set(trigger, new ResponseClass());
    }
  }

  public async start(ticket: string): Promise<void> {
    this.world = new World();
    this.client = new Client();
    this.input = new InputHandler();
    this.renderer = new Renderer();
    this.camera = new Camera();
    this.isReady = true;
    this.client.connect(ticket);
    this.loop.start();

    this.loop.events.on("UPDATE", (deltaTime: number) =>
      this.handleUpdate(deltaTime),
    );

    this.loop.events.on("TICK", (tick: number) => this.handleTick(tick));

    this.client.events.on("ROUTE_RESPONSES", (message: any) => {
      this.handleRouteResponses(message);
    });
  }

  public handleRouteResponses(message: any): void {
    if (!this.isReady) return;
    this.routeResponses(message);
  }

  /**
   * Tracks matrix movements and forces rendering sequentially under a uniform loop
   */
  public handleUpdate(deltaTime: number): void {
    if (!this.isReady || !this.world || !this.renderer) return;

    this.update(deltaTime);
  }

  public handleTick(tick: number): void {
    if (!this.world) return;
    this.tick(tick);
  }

  public async routeResponses(response: Response): Promise<void> {
    if (!response) return;
    const { type, data } = response;
    const handler = this.responseHandlers.get(type);

    if (!handler) {
      console.log(`No message handler found for: ${type}`);
      return;
    }

    try {
      await handler.execute({ game: this, data });
    } catch (error) {
      console.log(`Error executing handler: ${error}`);
    }
  }

  public update(tick: number): void {
    const { world, renderer, camera, input } = this;

    // Tier 1: Infrastructure Guard. If core engine systems aren't ready, fail fast.
    if (!this.isReady || !world || !renderer.canvas) return;

    const character = world.character;

    if (character) {
      character.handleInputMovement(input);
      camera.update(
        character,
        this.renderer.canvas!.width,
        this.renderer.canvas!.height,
      );
    }

    this.renderer.render(camera.x, camera.y);

    if (character) {
      this.renderer.renderCharacter(character, camera.x, camera.y);
    }

    // 🟢 Update simulation world
    world.update(tick);
  }

  public tick(tick: number): void {
    if (!this.isReady || !this.world) return;

    this.world.tick(tick);
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.renderer!.bind(canvas);
  }

  public shutdown(): void {
    if (!this.client) return;

    this.isReady = false;
    this.loop.stop();
    this.client.disconnect();

    if (this.world) {
      this.world.clear();
    }
    console.log("🛑 Game Engine core successfully shut down.");
  }
}
