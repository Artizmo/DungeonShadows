import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import World from "~/core/World";
import Camera from "~/core/Camera";
import { Serialize } from "~/shared/network/serialize";
import { ActionRegistry } from "./actions";

export default class Game {
  events: EventEmitter;
  world: World;
  renderer: Renderer;
  loop: Loop;
  network: Network;
  camera: Camera = new Camera();
  sequenceId = 0;

  constructor(
    world: World,
    renderer: Renderer,
    loop: Loop,
    network: Network,
    events: EventEmitter,
  ) {
    this.events = events;
    this.world = world;
    this.renderer = renderer;
    this.loop = loop;
    this.network = network;
    this.loop.onUpdate = (deltaTime: number) => this.update(deltaTime);
    this.loop.onTick = (tick: number) => this.tick(tick);
  }

  update(deltaTime: number): void {
    if (this.world.character) {
      const characterPixelX =
        this.world.character.renderPosition.x * this.renderer.TILE_SIZE;
      const characterPixelY =
        this.world.character.renderPosition.y * this.renderer.TILE_SIZE;

      this.camera.x = characterPixelX - this.renderer.width / 2;
      this.camera.y = characterPixelY - this.renderer.height / 2;
    }

    this.renderer.render(this.world.character, this.camera);
  }

  tick(tick: number): void {
    while (this.network.packetQueue.length > 0) {
      const packet = this.network.packetQueue.shift(); // Pulls and removes the oldest packet (FIFO)
      if (!packet) continue;

      const data = Serialize.decode(packet);
      const handler = ActionRegistry.get(data.actionType);
      handler?.execute(data, this);
    }
  }

  bindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.renderer.bind(canvas);
  }

  start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
  }

  stop(): void {
    this.loop.stop();
  }
}
