import EventEmitter from "eventemitter3";
import Game from "~/core/Game";
// import KeyboardController from "./KeyboardController";
// import GamepadController from "./GamepadController";
// import MenuManager from "./MenuManager";
import Renderer from "~/core/Renderer";
import Loop from "~/core/Loop";
import { LOOP_CONFIG } from "~/shared/constants";
import World from "~/core/World";
import Network from "~/core/Network";

const events = new EventEmitter();
// const keyboardController = new KeyboardController();
// const gamepadController = new GamepadController();
// const menuManager = new MenuManager();
const renderer = new Renderer();
const loop = new Loop(LOOP_CONFIG);
const world = new World();
const network = new Network();
const gameEngine = new Game(world, renderer, loop, network, events);

export default gameEngine;
