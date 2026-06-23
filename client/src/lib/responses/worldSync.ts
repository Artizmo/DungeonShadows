import type { IResponseHandler, ResponseContext } from "~/types/game";

export default class WorldSyncResponse implements IResponseHandler {
  public async execute({
    data,
    character,
    game,
  }: ResponseContext): Promise<void> {
    try {
      game.world?.reconcile(data.id, data.events[0].character.position);
    } catch (e) {}
  }
}
