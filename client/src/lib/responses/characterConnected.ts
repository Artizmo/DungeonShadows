import type { IResponseHandler, ResponseContext } from "~/types/game";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ game, data }: ResponseContext): Promise<void> {}
}
