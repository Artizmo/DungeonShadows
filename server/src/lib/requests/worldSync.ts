import { GameEventType } from "~/types/events";
import type { IRequestHandler, RequestContext } from "~/types/game";

export default class WorldSyncRequest implements IRequestHandler {
  public async execute({ player }: RequestContext): Promise<void> {
    const { character } = player;

    character.addPendingEvent({
      type: GameEventType.CHARACTER,
      character,
    });
  }
}
