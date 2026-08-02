// import type Character from "~/core/Character";
// import { CHUNK_SIZE } from "~/shared/core/constants";

// /** Clamps a coordinate within the map boundaries. Mutates the position directly. */
// export function clampPosition(
//   pos: { x: number; y: number },
//   mapW: number,
//   mapH: number,
//   padding: number = 0
// ) {
//   pos.x = Math.max(padding, Math.min(pos.x, mapW - padding));
//   pos.y = Math.max(padding, Math.min(pos.y, mapH - padding));
// }

// export function calculateAOIBuckets(
//   posX: number,
//   posY: number,
//   cameraWidth: number = 1920,
//   cameraHeight: number = 1080,
//   mapWidth: number,
//   mapHeight: number,
//   bufferRadius: number = 2
// ): Set<string> {
//   const buckets = new Set<string>();

//   const camW = cameraWidth || 1920;
//   const camH = cameraHeight || 1080;

//   const halfW = camW / 2;
//   const halfH = camH / 2;

//   // 🟢 1. Calculate max valid bucket indices based on actual map dimensions
//   const maxBucketX = Math.max(0, Math.floor((mapWidth - 1) / CHUNK_SIZE));
//   const maxBucketY = Math.max(0, Math.floor((mapHeight - 1) / CHUNK_SIZE));

//   // 2. Calculate pixel bounds
//   const minX = Math.max(0, posX - halfW);
//   const maxX = Math.min(mapWidth, posX + halfW);
//   const minY = Math.max(0, posY - halfH);
//   const maxY = Math.min(mapHeight, posY + halfH);

//   // 3. Convert pixel bounds to chunk grid indices with buffer
//   const startBucketX = Math.floor(minX / CHUNK_SIZE) - bufferRadius;
//   const endBucketX = Math.floor(maxX / CHUNK_SIZE) + bufferRadius;
//   const startBucketY = Math.floor(minY / CHUNK_SIZE) - bufferRadius;
//   const endBucketY = Math.floor(maxY / CHUNK_SIZE) + bufferRadius;

//   // 🟢 4. Clamp the loop tightly between 0 and maxBucketX/Y
//   const clampedStartX = Math.max(0, startBucketX);
//   const clampedEndX = Math.min(maxBucketX, endBucketX);
//   const clampedStartY = Math.max(0, startBucketY);
//   const clampedEndY = Math.min(maxBucketY, endBucketY);

//   for (let bx = clampedStartX; bx <= clampedEndX; bx++) {
//     for (let by = clampedStartY; by <= clampedEndY; by++) {
//       buckets.add(`${bx}_${by}`);
//     }
//   }

//   return buckets;
// }

// export function isEntityInCamera(
//   camMinX: number,
//   camMinY: number,
//   camMaxX: number,
//   camMaxY: number,
//   entityX: number,
//   entityY: number,
//   entityW: number = 32,
//   entityH: number = 32,
//   padding: number = 64 // 🟢 256px safety padding around screen edge prevents chunk boundary pop-out
// ): boolean {
//   return (
//     entityX + entityW >= camMinX - padding &&
//     entityX <= camMaxX + padding &&
//     entityY + entityH >= camMinY - padding &&
//     entityY <= camMaxY + padding
//   );
// }

// /** Finds which chunk keys were removed and which were added */
// export function getSetDifferences(
//   oldSet: Set<string>,
//   newSet: Set<string>
// ): { removed: string[]; added: string[] } {
//   const removed: string[] = [];
//   const added: string[] = [];

//   for (const item of oldSet) {
//     if (!newSet.has(item)) removed.push(item);
//   }

//   for (const item of newSet) {
//     if (!oldSet.has(item)) added.push(item);
//   }

//   return { removed, added };
// }

// export function getCharactersInAOI(character: Character): number[] {
//   const zone = this.getZone(character.zoneId);
//   if (!zone) return [];

//   const neighbors = new Set<number>();

//   for (const bucketKey of character.AOIBucketKeys) {
//     const bucket = zone.buckets.get(bucketKey);
//     if (!bucket) continue;

//     for (const entityId of bucket.entities) {
//       if (entityId !== character.id && this.characters.has(entityId)) {
//         neighbors.add(entityId);
//       }
//     }
//   }

//   return Array.from(neighbors);
// }
