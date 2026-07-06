import type EventEmitter from "eventemitter3";
import type Loop from "~/core/Loop";
import type Renderer from "~/core/Renderer";
import type Network from "~/core/Network";
import World from "~/core/World";
import Camera from "~/core/Camera";

export default class Game {
  events: EventEmitter;
  world: World;
  renderer: Renderer;
  loop: Loop;
  network: Network;
  camera: Camera = new Camera();

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
    // console.log("bingo update", deltaTime);

    this.renderer.render(this.world.character, this.camera);
  }

  tick(tick: number): void {
    for (const packet of this.network.packetQueue) {
      // console.log("bingo packet", packet);
    }
  }

  bindCanvas(canvas: HTMLCanvasElement): void {
    if (!canvas) return;

    this.renderer.bind(canvas);
  }

  start(ticket: string): void {
    this.loop.start();
    this.network.connect(ticket);
    this.world = new World();
  }

  stop(): void {
    this.loop.stop();
  }
}
