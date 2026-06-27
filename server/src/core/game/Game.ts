import { Log } from "~/shared/core/Logger";
import Loop from "~/core/game/Loop";
import Server from "~/core/game/Server";
import World from "~/core/world/World";
import type {
  Config,
  GameEventMap,
  IGameHandler,
  NetworkMessage,
} from "~/core/game/@types";
import { REQUEST_REGISTRY } from "~/_lib/requests";
import { MapCache } from "~/_utils/mapCache";

export default class Game {
  readonly config: Config;
  readonly loop: Loop;
  public server!: Server;
  public world!: World;
  public mapCache: MapCache = new MapCache();
  public isReady = false;
  private readonly requestHandlers = new Map<
    keyof GameEventMap,
    IGameHandler<any>
  >();

  constructor(config: Config) {
    this.config = config;
    this.loop = new Loop(this.config);
    this.registerHandlers();
  }

  private registerHandlers(): void {
    let handlerKey: keyof GameEventMap;

    for (handlerKey in REQUEST_REGISTRY) {
      const Handler = REQUEST_REGISTRY[handlerKey];
      this.requestHandlers.set(handlerKey, new Handler(this));
    }
  }

  public start(worldPath: string): void {
    this.world = new World(worldPath);
    this.server = new Server(this.config);
    this.isReady = true;
    this.loop.start();

    // [ ] implement the same events registry as World has

    this.loop.events.on("UPDATE", (deltaTime: number) => {
      if (!this.isReady) return;

      this.handleUpdate(deltaTime);
    });

    this.loop.events.on("TICK", (tick: number) => {
      if (!this.isReady) return;

      this.handleTick(tick);
    });

    this.server.events.on("player_disconnect", (playerId: number) => {
      this.bootPlayer(playerId);
    });

    this.server.events.on("player_join", (playerConnection) => {
      this.handlePlayerJoin(playerConnection);
    });

    this.server.events.on("route_requests", ({ request, playerId }) => {
      this.routeRequests(request, playerId);
    });
  }

  public async handlePlayerJoin({
    playerId,
    characterId,
    connection,
  }): Promise<void> {
    const handler = this.requestHandlers.get("PLAYER_JOIN");
    await handler.execute({ playerId, characterId, connection });
  }

  public handleUpdate(deltaTime: number): void {
    this.update(deltaTime);
  }

  public handleTick(tick: number): void {
    this.tick(tick);
  }

  public async routeRequests(
    request: NetworkMessage,
    playerId: number,
  ): Promise<void> {
    if (!this.isReady) return;

    const handler = this.requestHandlers.get(
      request.type as keyof GameEventMap,
    );
    if (!handler) {
      // player.send({
      //   type: "WARN",
      //   data: `No message handler found for: ${request.type}`,
      // });
      Log.SYSTEM.WARN(`No message handler found for: ${request.type}`);
      return;
    }

    try {
      // await handler.execute({
      //   player,
      //   game: this,
      //   data: request.data,
      //   args: request.data?.args || [],
      // });
    } catch (e) {
      // player.send({ type: "ERROR", data: `Error executing handler: ${e}` });
      Log.SYSTEM.ERROR(`Error executing handler: ${e}`);
    }
  }

  public update(tick: number): void {
    this.world.update(tick);
  }

  public tick(tick: number): void {
    this.world.tick(tick);
  }

  // public async joinPlayer({
  //   characterId,
  //   playerId,
  //   playerSocket,
  // }): Promise<void> {
  //   try {
  //     const playerData = await fetchPlayer(playerId);
  //     const player = new Player(playerData, playerSocket);
  //     player.isAlive = true;

  //     const character: Character = await fetchCharacter(characterId);
  //     character.player = player;

  //     const zoneMap = await fetchZoneMap(character.zoneMap);

  //     Log.SERVER.INFO(`${player.fullName} has connected!`);
  //     this.world.join(character);
  //     player.send({ type: "CHARACTER_UPDATE", character });
  //   } catch (error) {
  //     Log.DATA.ERROR(`Could not load data: ${error}`);
  //     return;
  //   }
  // }

  public bootPlayer(playerId: number): void {
    if (!playerId) return;

    try {
      for (const character of this.world.characters.values()) {
        if (character.player.id === playerId) {
          this.world.leave(character);
          Log.SERVER.INFO(`${character.player.fullName} has disconnected!`);
        }
      }
    } catch (e) {
      Log.SYSTEM.ERROR(e);
    }
  }
}
