// import Character from "~/core/Character";
// import type { ActionHandler } from "~/core/handlers/types";
// import Zone from "../Zone";

// // [ ] Factor out this file. This should come through as a snapshot
// export const Connect: ActionHandler = {
//   handle: ({ data, game }): void => {
//     if (!game) return;

//     const { chunks, unchunks, entities } = data;
//     const character = new Character(data.character);
//     const zone = new Zone(data.zone);

//     character.zone = zone;
//     game.world.areas.get(zone.areaId)?.addZone(zone);
//     game.world.add(character); // Add local player

//     // 1. Load map textures into the renderer's cache
//     game.renderer.loadMap(chunks, unchunks);

//     // 2. Store the baseline entities in your client's World state!
//     // (Assuming game.world.entities is a Map. If it's an array, just assign it)
//     game.world.entities.clear();
//     if (entities?.length > 0) {
//       for (const entity of entities) {
//         game.world.entities.set(entity.id, entity);
//       }
//     }

//     // 3. Emit the update to unblock the client rendering loop
//     game.events.emit("game_update");
//   },
// };
