import EventEmitter from "eventemitter3";
import Client from "~/core/Client";
import Loop from "~/core/Loop";
import World from "~/core/World";
import Renderer from "~/core/Renderer";
import InputHandler from "~/core/InputHandler";
import type { Config } from "~/shared/core/types";
import Camera from "./Camera";
import { Serialize } from "~/shared/network/serializer";
import { GameProtocol } from "~/shared/network/generated/index.js";
import { Deserialize } from "~/shared/network/deserializer";
import { PacketRegistry } from "~/shared/network/packet-structures";
import { ActionRegistry } from "~/core/actions/actionRegistry";
import { inputBindings } from "~/core/_utils/inputBindings";

// [ ] Move to DI for these classes.
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

    // 🟢 UNIFIED PIPELINE STREAM ENTRYPOINT
    this.client.events.on("world_state", (data: Uint8Array) => {
      if (!this.isReady || !data) return;

      this.handleWorldState(data);
    });
  }

  /**
   * Parses uniform server packets and dynamically passes messages to registered action handlers
   */
  private handleWorldState(binaryData: Uint8Array): void {
    try {
      const packet = Deserialize.packet(binaryData);

      // 🟢 1. Extract the highest processed sequence ID embedded in the message stream
      let highestProcessedId = 0;
      for (const msg of packet.messages) {
        if (!msg.sequenceId) continue;

        if (msg.sequenceId! > highestProcessedId) {
          highestProcessedId = msg.sequenceId;
        }
      }

      // 🟢 2. Authoritative Eviction: Clean the client's predicted buffer using that extracted ID
      if (this.world?.character && highestProcessedId > 0) {
        this.world.character.pendingActions =
          this.world.character.pendingActions.filter(
            (action) => action.sequenceId > highestProcessedId,
          );
      }

      // 3. Loop over the unified message payload and delegate routing
      for (const msg of packet.messages) {
        // Look up by msg.actionType or fallback to msg.type based on your layout rule
        const handler = ActionRegistry.get(msg.actionType);

        if (handler) {
          // Execute the formal interface method contract (e.g., reconcile)
          handler.execute(msg, {
            character: this.world.character,
            game: this,
          });
        } else {
          console.warn(
            `No client action handler registered for ActionType: ${msg.actionType}`,
          );
        }
      }
    } catch (error) {
      console.error(
        `Error parsing uniform packet stream in handleWorldState: ${error}`,
      );
    }
  }

  private processInputs(deltaTime: number): void {
    this.input.updateGamepadState();

    const activeKeys = this.input.keys;
    const uniqueActionsToRun = new Set<GameProtocol.ActionType>();
    for (const key in activeKeys) {
      if (!activeKeys[key]) continue;

      const actionType: GameProtocol.ActionType = inputBindings[key];
      if (actionType) {
        uniqueActionsToRun.add(actionType);
      }
    }
    for (const actionType of uniqueActionsToRun) {
      const { character } = this.world;
      const action = ActionRegistry.get(actionType);
      if (!action) continue;

      const payload = action.getPayload!(activeKeys, deltaTime);
      if (!payload) continue;

      action.execute(payload, {
        character,
        game: this,
      });
    }
  }

  public update(deltaTime: number): void {
    if (!this.isReady || !this.world?.character) return;

    this.processInputs(deltaTime);
    this.world.update(deltaTime);
    this.world.character.update(deltaTime);
    this.draw();
  }

  public tick(tick: number): void {
    if (!this.isReady || !this.world?.character) return;
    const { character } = this.world;
    const pendingActions = this.world.character.pendingActions;

    // 🟢 Dynamic Serialization Loop using the PacketRegistry Map
    if (pendingActions.length > 0) {
      const requests = [];

      for (const action of pendingActions) {
        const { sequenceId, type } = action;
        const packetLayout = PacketRegistry.get(type);

        if (packetLayout) {
          const packet = packetLayout.structure(
            action,
            sequenceId,
            character.id,
          );
          requests.push(packet);
        } else {
          console.warn(
            `No packet registry encoder found for action type: ${type}`,
          );
        }
      }

      if (requests.length > 0) {
        const data = Serialize.packet(
          requests.map((req) => ({
            type: req.type,
            actionType: req.actionType,
            sequenceId: req.sequenceId,
            targetId: req.targetId,
            ints: req.ints ?? [],
            floats: req.floats ?? [],
            strings: req.strings ?? [],
            bytes: req.bytes ?? undefined,
          })),
        );
        // const data = Serialize.packet(requests);
        this.client.sendBinary(data);
      }
    }

    this.world.tick(tick);
  }

  public draw(): void {
    if (!this.world.character) return;

    this.camera.update(
      this.world.character,
      this.renderer.width,
      this.renderer.height,
    );

    this.renderer.render(this.camera);
    this.renderer.renderCharacter(this.world.character, this.camera);
  }

  public bindCanvas(canvas: HTMLCanvasElement): void {
    this.renderer.bind(canvas);
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
