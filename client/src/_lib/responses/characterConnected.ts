import type { IResponseHandler, ResponseContext } from "~/core/game/@types";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ game, data }: ResponseContext): Promise<void> {}
}
