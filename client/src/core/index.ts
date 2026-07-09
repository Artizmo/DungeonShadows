import EventEmitter from "eventemitter3";
import Game from "~/core/Game";
import Renderer from "~/core/Renderer";
import Loop from "~/core/Loop";
import World from "~/core/World";
import Network from "~/core/Network";
import { LoopConfig } from "~/shared/core/constants";

const events = new EventEmitter();
const renderer = new Renderer();
const loop = new Loop(LoopConfig);
const world = new World();
const network = new Network();
const gameEngine = new Game(world, renderer, loop, network, events);

export default gameEngine;
