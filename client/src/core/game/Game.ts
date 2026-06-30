import EventEmitter from "eventemitter3";
import { Client } from "~/core/game/Client";
import { Loop } from "~/core/game/Loop";
import { World } from "~/core/world/World";
import Renderer from "~/core/Renderer";
import InputHandler from "~/core/InputHandler";
import type { Config, IResponseHandler } from "~/core/game/@types";
import Camera from "../Camera";
import { Serialize } from "~/shared/serialize/serializer";
import WorldStateResponse from "~/_lib/responses/worldState";

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

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(config);
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

    this.client.events.on("world_state", (data: Uint8Array) => {
      this.handleResponseHandler(data);
    });
  }

  public handleResponseHandler(data: Uint8Array): void {
    if (!this.isReady) return;

    this.responseHandler(data);
  }

  public handleUpdate(deltaTime: number): void {
    if (!this.isReady || !this.world || !this.renderer) return;

    this.update(deltaTime);
  }

  public handleTick(tick: number): void {
    if (!this.world) return;
    this.tick(tick);
  }

  public async responseHandler(data: Uint8Array): Promise<void> {
    if (!data) return;

    const handler = new WorldStateResponse(this);

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

      character.updateVisuals();

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
      const data: Uint8Array = Serialize.packet(
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
