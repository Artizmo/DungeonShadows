import EventEmitter from "eventemitter3";
import Client from "~/core/game/Client";
import Loop from "~/core/game/Loop";
import World from "~/core/world/World";
import Renderer from "~/core/Renderer";
import InputHandler from "~/core/InputHandler";
import type { Config } from "~/core/game/types";
import Camera from "../Camera";
import { Serialize } from "~/shared/serialize/serializer";
import WorldStateResponse from "~/_lib/responses/worldState";
import { inputBindings } from "~/shared/actions/inputBindings";
import {
  actionsRegistry,
  type ActionType,
} from "~/shared/actions/actionRegistry";

export default class Game {
  public readonly config: Config;
  public readonly loop: Loop;
  public events: EventEmitter;
  public client!: Client;
  public world!: World;
  public camera!: Camera;
  public input!: InputHandler;
  public renderer!: Renderer;
  public isReady = false;

  constructor(config: Config) {
    this.config = config;
    this.events = new EventEmitter();
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

    this.loop.events.on("update", (deltaTime: number) => {
      if (!this.isReady) return;

      this.update(deltaTime);
    });

    this.loop.events.on("tick", (tick: number) => {
      if (!this.isReady) return;

      this.tick(tick);
    });

    this.client.events.on("world_state", async (data: Uint8Array) => {
      if (!this.isReady) return;
      if (!data) return;

      const handler = new WorldStateResponse(this);

      try {
        await handler.execute({ game: this, data });
      } catch (error) {
        console.log(`Error executing handler: ${error}`);
      }
    });
  }

  private processInputs(): void {
    this.input.updateGamepadState();

    const activeKeys = this.input.keys;
    const uniqueActionsToRun = new Set<string>();
    for (const key in activeKeys) {
      if (!activeKeys[key]) continue;

      const actionType: ActionType = inputBindings[key];
      if (actionType) {
        uniqueActionsToRun.add(actionType);
      }
    }
    for (const actionType of uniqueActionsToRun) {
      const action = actionsRegistry[actionType as ActionType];
      if (!action) continue;

      const payload = action.getPayload(activeKeys);
      if (!payload) continue;

      action.execute(payload, {
        character: this.world.character,
        world: this.world,
        game: this,
      });
    }
  }

  public update(tick: number): void {
    const { world, renderer, camera } = this;
    const { character } = world;

    this.processInputs();

    if (character) {
      character.update();
      camera.update(character, renderer.canvas!.width, renderer.canvas!.height);
      renderer.render(camera.x, camera.y);
      renderer.renderCharacter(character, camera.x, camera.y);
    }

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
