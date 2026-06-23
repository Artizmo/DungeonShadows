import Character from "~/core/Character";
import type { IResponseHandler, ResponseContext } from "~/types/game";

export default class CharacterConnectedResponse implements IResponseHandler {
  public async execute({ game, data }: ResponseContext): Promise<void> {
    console.log(`Connection authorized by realm: ${data.name}`);

    // 1. Instantiate the character core model
    const character = new Character(data);

    // 2. Attach it directly onto the Engine Core
    game.character = character;
    const img = new Image();
    img.src = `data:image/webp;base64,${character.zoneMap}`;

    img.onload = () => {
      // 1. Cache the image directly in your renderer instance memory
      game.renderer!.zoneWebpImage = img;

      // 3. Set your zone identifier flags
      // this.game.world.zoneId = zoneId;

      // 4. Fire up your requestAnimationFrame loop
      // this.game.isReady = true;
      game.renderer!.render();
      console.log("Secure zone asset mounted successfully.");
    };
    // game.renderer.loadZoneById(character.zoneId);

    // 3. Fire the request back to the server to download their sliver of the world
    game.send("WORLD_SYNC_REQUEST", {
      characterId: character.id,
    });
  }
}
