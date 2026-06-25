import type { IResponseHandler, ResponseContext } from "~/types/game";

export default class WorldSyncResponse implements IResponseHandler {
  public async execute({ data, game }: ResponseContext): Promise<void> {
    try {
      console.log("bingo tick", data);
      game.world?.reconcile(data.tick, data.events[0].character.position);
    } catch (e) {}
  }
}
