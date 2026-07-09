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
import { inputDictionary } from "~/core/commands/input-dictionary";
import { CommandType } from "~/core/commands/index";
import { ActionType } from "~/shared/core/types";

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

    // 1. Process inputs and move the character
    this.processInputs(deltaTime);
    // 2. Update the camera to follow the new position
    this.camera.update(this.world.character, this.renderer.canvas!);
    // 3. Finally, render the up-to-date scene
    this.renderer.render(this.world.character, this.camera);
  }

  tick(tick: number): void {
    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift(); // Pulls and removes the oldest packet (FIFO)
      if (!packet) continue;

      const data = Serialize.decode(packet);
      const handler = ActionRegistry.get(data.actionType);
      const { character } = this.world;
      handler?.execute({ data, character, game: this });
    }
  }

  processInputs(deltaTime: number): void {
    const { character } = this.world;
    this.activeCommands.clear();

    // 1. Gather raw inputs
    this.gamepad.update();
    const rawKeyboard = this.keyboard.activeKeys;
    const rawGamepad = this.gamepad.activeKeys;
    const context = "DEFAULT";

    // 2. Map input to explicit action strings
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

    if (this.activeCommands.size === 0) return;

    // 3. Evaluate Movement as a single unified vector
    let dx = 0,
      dy = 0;
    if (this.activeCommands.has(CommandType.MOVE_UP)) dy -= 1;
    if (this.activeCommands.has(CommandType.MOVE_DOWN)) dy += 1;
    if (this.activeCommands.has(CommandType.MOVE_LEFT)) dx -= 1;
    if (this.activeCommands.has(CommandType.MOVE_RIGHT)) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const handler = ActionRegistry.get(ActionType.MOVE);
      if (handler) {
        handler.execute({
          data: { payload: { x: dx, y: dy }, deltaTime },
          character,
          game: this,
        });
      }
    }

    // Handle other distinct commands here (like CAST_SPELL) without looping over activeCommands directly
  }

  start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
  }

  stop(): void {
    // this.loop.stop();
  }

  handleBindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.renderer.bind(canvas);
  }
}
