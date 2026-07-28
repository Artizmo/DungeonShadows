import World from "~/core/World";
import Camera from "~/core/Camera";
import GamepadController from "~/core/GamepadController";
import KeyboardController from "~/core/KeyboardController";
import { Serialize } from "~/shared/core/serialize";
import { ActionRegistry } from "./handlers";
import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import {
  actionDictionary,
  inputDictionary,
} from "~/core/utils/input-dictionary";
import { CommandType } from "~/core/utils/input-dictionary";
import { ActionType, PacketCategory } from "~/shared/core/types";
import type { StateManager } from "~/core/StateManager";
import { FLAG_DESPAWN } from "~/shared/core/constants";

export default class Game {
  events: EventEmitter;
  loop: Loop;
  network: Network;
  world: World;
  renderer: Renderer;
  camera: Camera = new Camera();
  gamepad: GamepadController;
  keyboard: KeyboardController;
  stateManager: StateManager;
  sequenceId = 0;
  private activeCommands = new Set<CommandType>();
  private readonly DELTA_TIME = 1 / 20;
  private readonly MAX_INPUT_HISTORY = 10;

  constructor(
    world: World,
    renderer: Renderer,
    loop: Loop,
    network: Network,
    events: EventEmitter,
    gamepad: GamepadController,
    keyboard: KeyboardController,
    stateManager: StateManager
  ) {
    this.events = events;
    this.world = world;
    this.renderer = renderer;
    this.loop = loop;
    this.network = network;
    this.gamepad = gamepad;
    this.keyboard = keyboard;
    this.stateManager = stateManager;

    this.loop.onUpdate = (alpha: number) => this.update(alpha);
    this.loop.onTick = () => this.tick();
  }

  processInputs(): void {
    const { character } = this.world;
    const keyboard = this.keyboard.activeKeys;
    const gamepad = this.gamepad.activeKeys;
    const context = "DEFAULT";
    const actionTypeQueue: Set<ActionType> = new Set();

    this.activeCommands.clear();
    this.gamepad.update();

    // 🟢 Grab and process character input
    const inputControllers = [
      { control: keyboard, input: inputDictionary[context]?.["keyboard"] },
      { control: gamepad, input: inputDictionary[context]?.["gamepad"] },
    ];

    inputControllers.forEach((inputController) => {
      if (!inputController.input) return;

      const inputCollection = new Set(inputController.control);
      for (const input of inputCollection) {
        const command = inputController.input[input];
        if (command) {
          this.activeCommands.add(command);
        }
      }
    });

    // 🟢 Collect actions
    for (const command of this.activeCommands) {
      const actionType = actionDictionary[command];
      if (actionType) actionTypeQueue.add(actionType);
    }

    // 🟢 Add actions to history
    const { tick } = this.loop;
    const { pendingActions } = this.world.character;
    const activeCommands = new Set(this.activeCommands);

    // Increment sequenceId
    this.sequenceId++;
    const { sequenceId } = this;

    for (const action of actionTypeQueue) {
      pendingActions.push({
        sequenceId,
        tick,
        action,
        activeCommands,
      });
    }

    // 🟢 Loop actions, update local state (client prediction)
    if (actionTypeQueue.size > 0) {
      for (const actionType of actionTypeQueue) {
        const handler = ActionRegistry.get(actionType);
        if (!handler) continue;

        handler.handle({
          data: {
            activeCommands: this.activeCommands,
            deltaTime: this.DELTA_TIME,
          },
          game: this,
        });
      }
    }

    // 🟢 Send action request to the server for notary
    this.network.send(
      Serialize.action({
        characterId: character.id,
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        actions: Array.from(actionTypeQueue),
        activeCommands: Array.from(this.activeCommands),
      })
    );
  }

  update(alpha: number): void {
    if (!this.world.character) return;

    const { character } = this.world;
    const { position, prevPosition, renderPosition } = character;

    // 🟢 Calculate final render position and LERP
    renderPosition.x = prevPosition.x + (position.x - prevPosition.x) * alpha;
    renderPosition.y = prevPosition.y + (position.y - prevPosition.y) * alpha;

    this.camera.update(character, this.renderer.canvas!);
    this.renderer.render(
      this.world.character,
      this.camera,
      this.world.entities // The renderer will now draw them!
    );
  }

  tick(): void {
    if (this.world.character) {
      this.events.emit("game_update");
      this.world.character.tick();
      this.processInputs();
    }

    // Process incoming network packets at fixed tick rate
    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift();
      if (!packet) continue;

      const data = Serialize.decode(packet);

      // Process event-driven server responses directly
      if (data.actionType) {
        const handler = ActionRegistry.get(data.actionType);
        const { character } = this.world;
        handler?.handle({ data, character, game: this });
      }

      if (!this.world.character) continue;

      // 🟢 Process state snapshot server responses
      if (data.category === PacketCategory.SNAPSHOT) {
        // 1. Process world entities (NPCs, other players)
        if (data.entities.length > 1) {
          console.log("bingo snapshot", data);
        }
        if (Array.isArray(data.entities)) {
          this.processEntityDeltas(data.entities);
        }

        // 2. Perform local character input reconciliation
        this.handleServerReconciliation(data);
      }
    }
  }

  private processEntityDeltas(entities: any[]): void {
    const localPlayerId = this.world.character.id;

    for (const delta of entities) {
      // Skip local character reconciliation here (handled in handleServerReconciliation)
      if (delta.id === localPlayerId) continue;

      const { id, flags, position } = delta;
      if (flags & FLAG_DESPAWN) {
        this.world.entities.delete(id); // or remove from Map/Array depending on world.entities structure
        continue;
      }

      // 🟢 2. Handle Spawn or State Update
      let entity = this.world.entities.get(id);

      if (!entity) {
        // Construct or register new entity if it doesn't exist locally
        entity = {
          id: delta.id,
          name: delta.name,
          level: delta.level,
          type: delta.type,
          position: delta.position ? { ...delta.position } : { x: 0, y: 0 },
          width: delta.width ?? 32,
          height: delta.height ?? 32,
        };
        this.world.entities.set(id, entity);
      } else {
        // Update existing entity coordinates
        if (position) {
          entity.position.x = position.x;
          entity.position.y = position.y;
        }
      }
    }
  }

  private handleServerReconciliation(serverData: any): void {
    if (!this.world.character) return;
    const { character } = this.world;

    // 1. Purge acknowledged inputs from history
    while (
      character.pendingActions.length > 0 &&
      (character.pendingActions[0].sequenceId <=
        serverData.lastProcessedSequenceId ||
        character.pendingActions.length > this.MAX_INPUT_HISTORY)
    ) {
      character.pendingActions.shift();
    }

    // 🟢 2. Find local player delta inside entities array
    const localCharDelta = serverData.entities?.find(
      (e: any) => e.id === character.id
    );

    // If local player isn't in this snapshot delta, skip reconciliation
    if (!localCharDelta) return;

    // Apply baseline server state for local player
    this.stateManager.setState(character, localCharDelta);

    // 3. Replay pending actions on top of server baseline
    for (const savedInput of character.pendingActions) {
      const handler = ActionRegistry.get(savedInput.action);
      if (handler) {
        handler.handle({
          data: {
            activeCommands: savedInput.activeCommands,
            deltaTime: this.DELTA_TIME,
          },
          character,
          game: this,
        });
      }
    }

    // 4. Compare replayed state vs predicted state
    this.stateManager.reconcile(character);
  }

  start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
  }

  handleBindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.renderer.bind(canvas);
  }
}
