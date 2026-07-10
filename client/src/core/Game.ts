import World from "~/core/World";
import Camera from "~/core/Camera";
import GamepadController from "~/core/GamepadController";
import KeyboardController from "~/core/KeyboardController";
import { Serialize } from "~/shared/network/serialize";
import { ActionRegistry } from "./actions";
import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import {
  actionDictionary,
  inputDictionary,
} from "~/core/commands/input-dictionary";
import { CommandType } from "~/core/commands/index";
import { ActionType } from "~/shared/core/types";
import type { InputAction, WorldState } from "./types";

export default class Game {
  events: EventEmitter;
  world: World;
  renderer: Renderer;
  loop: Loop;
  network: Network;
  gamepad: GamepadController;
  keyboard: KeyboardController;
  camera: Camera = new Camera();
  sequenceId = 0;
  private activeCommands = new Set<CommandType>();
  private inputHistory: Array<{
    sequenceId: number;
    tick: number;
    actions: Set<ActionType>;
    commands: Set<CommandType>;
  }> = [];
  private stateHistory: Array<{
    sequenceId: number;
    tick: number;
    actions: Set<ActionType>;
    state: WorldState;
  }> = [];

  constructor(
    world: World,
    renderer: Renderer,
    loop: Loop,
    network: Network,
    events: EventEmitter,
    gamepad: GamepadController,
    keyboard: KeyboardController,
  ) {
    this.events = events;
    this.world = world;
    this.renderer = renderer;
    this.loop = loop;
    this.network = network;
    this.gamepad = gamepad;
    this.keyboard = keyboard;

    this.loop.onUpdate = (deltaTime: number) => this.update(deltaTime);
    this.loop.onTick = (tick: number) => this.tick(tick);
  }

  update(deltaTime: number): void {
    if (!this.world.character) return;

    const { character } = this.world;
    // 1. Process inputs and move the character
    // this.processInputs();
    const lerpFactor = 1 - Math.hypot(0.01, deltaTime);

    character.renderPosition.x +=
      (character.position.x - character.renderPosition.x) * lerpFactor;
    character.renderPosition.y +=
      (character.position.y - character.renderPosition.y) * lerpFactor;
    // 2. Update the camera to follow the new position
    this.camera.update(character, this.renderer.canvas!);
    // 3. Finally, render the up-to-date scene
    this.renderer.render(character, this.camera);
  }

  tick(tick: number): void {
    if (this.world.character) {
      this.processInputs();
    }

    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift();
      if (!packet) continue;

      const data = Serialize.decode(packet);

      // Check if this packet is a World State / Update from the server
      if (data.actionType === "SERVER_UPDATE") {
        this.handleServerReconciliation(data);
      } else {
        // Fallback for immediate non-movement action handlers
        const handler = ActionRegistry.get(data.actionType);
        const { character } = this.world;
        handler?.execute({ data, character, game: this });
      }
    }
  }

  private handleServerReconciliation(serverData: any): void {
    const { character } = this.world;
    if (!character) return;

    // 1. Teleport local character to the absolute authoritative position
    character.position.x = serverData.playerState.x;
    character.position.y = serverData.playerState.y;

    // 2. Drop all inputs that the server has already acknowledged and processed
    this.inputHistory = this.inputHistory.filter(
      (input) => input.sequenceId > serverData.lastProcessedSequenceId,
    );

    // Cap history size just in case network synchronization stretches or drops out completely
    const MAX_HISTORY_TICKS = 100;
    if (this.inputHistory.length > MAX_HISTORY_TICKS) {
      this.inputHistory = this.inputHistory.slice(-MAX_HISTORY_TICKS);
    }

    // 3. REPLAY all inputs that are still outstanding (not yet processed by server)
    for (const savedInput of this.inputHistory) {
      const FIXED_DELTA = 1 / 20; // Ensure this matches your server tickrate perfectly

      // Reconstruction of the simulation parameters for each history frame
      const dataContext = {
        activeCommands: savedInput.commands,
        speed: character.speed,
        deltaTime: FIXED_DELTA,
      };

      // Re-run the movement action locally on top of the server baseline
      const handler = ActionRegistry.get(ActionType.MOVE); // Ensure this maps to your Move registry key
      if (handler) {
        handler.execute({ data: dataContext, character, game: this });
      }
    }
  }

  processInputs(): void {
    const { character } = this.world;
    this.activeCommands.clear();

    this.gamepad.update();
    const rawKeyboard = this.keyboard.activeKeys;
    const rawGamepad = this.gamepad.activeKeys;
    const context = "DEFAULT";
    const actionTypeQueue: Set<ActionType> = new Set();

    const kMap = inputDictionary[context]?.["keyboard"];
    if (kMap)
      rawKeyboard.forEach((k) => {
        if (kMap[k]) this.activeCommands.add(kMap[k]);
      });

    const gMap = inputDictionary[context]?.["gamepad"];
    if (gMap)
      rawGamepad.forEach((k) => {
        if (gMap[k]) this.activeCommands.add(gMap[k]);
      });

    for (const type of this.activeCommands) {
      const actionType = actionDictionary[type];
      if (actionType) actionTypeQueue.add(actionType);
    }

    this.sequenceId++;

    this.inputHistory.push({
      sequenceId: this.sequenceId,
      tick: this.loop.tick,
      actions: new Set(actionTypeQueue),
      commands: new Set(this.activeCommands),
    });

    // 🟢 Only run prediction if there are actual actions to simulate
    if (actionTypeQueue.size > 0) {
      for (const actionType of actionTypeQueue) {
        const handler = ActionRegistry.get(actionType);
        if (!handler) continue;

        const FIXED_DELTA = 1 / 20;
        handler.execute({
          data: {
            activeCommands: this.activeCommands,
            speed: character.speed,
            deltaTime: FIXED_DELTA,
          },
          character,
          game: this,
        });
      }
    }

    // 🟢 Always tell the server our latest sequenceId, even if actions array is empty []
    this.network.send(
      Serialize.serializeAction({
        sequenceId: this.sequenceId,
        tick: this.loop.tick,
        actions: Array.from(actionTypeQueue),
      }),
    );

    this.stateHistory.push({
      sequenceId: this.sequenceId,
      tick: this.loop.tick,
      actions: new Set(actionTypeQueue),
      state: {
        character: {
          stats: { ...character.stats },
          position: { ...character.position },
        },
      },
    });

    if (this.stateHistory.length > 15) {
      this.stateHistory.shift();
    }
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
