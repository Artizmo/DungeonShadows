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
import type { IMovePayload } from "~/shared/serialize/@types";
import { Serialize } from "~/shared/serialize/serializer";

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
    const { character } = world;

    if (character) {
      // 1. 🟢 Phase 1: Client prediction (updates character.position)
      character.handleInputMovement(input);

      // 2. 🟢 Phase 6: Smooth Interpolation (updates character.renderX/Y toward character.position)
      // Pass a standardized delta time frame slice (1/60s) for the LERP calculation
      character.updateVisuals(1 / 60);

      // 3. Update the camera view target based on the smooth visual position
      camera.update(character, renderer.canvas!.width, renderer.canvas!.height);

      // 4. Draw the background and smooth entity models
      renderer.render(camera.x, camera.y);
      renderer.renderCharacter(character, camera.x, camera.y);
    }

    // 5. 🟢 Update simulation world
    world.update(tick);
  }

  public tick(tick: number): void {
    if (!this.isReady || !this.world) return;
    if (!this.world.character) return;

    // 🟢 Send character actions to server
    if (this.world?.character?.pendingActions?.length > 0) {
      // Pass the ENTIRE array to the serializer, not individual pieces!
      const data: Uint8Array = Serialize.pendingActions(
        this.world.character.pendingActions,
      );

      // Blast the single, efficient batch packet over the wire
      this.client.sendBinary(data);
    }

    this.world.tick(tick);
    this.world.character.pendingActions = [];
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
