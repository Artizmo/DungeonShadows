import type { IResponseHandler, ResponseContext } from "~/core/game/@types";

export default class WorldSyncResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    try {
      game.world?.reconcile(data.tick, data.events[0].character.position);
    } catch (e) {}
  }
}
