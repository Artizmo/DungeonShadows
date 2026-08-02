// import { CHUNK_SIZE } from "~/shared/core/constants";

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

//   const camW = cameraWidth;
//   const camH = cameraHeight;

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

// /**
//  * Checks if an entity's AABB intersects with a camera's precalculated AABB.
//  * Zero object allocations.
//  */
// export function isEntityInCamera(
//   camMinX: number,
//   camMinY: number,
//   camMaxX: number,
//   camMaxY: number,
//   entityX: number,
//   entityY: number,
//   entityW: number = 32,
//   entityH: number = 32,
//   padding: number = 256
// ): boolean {
//   return (
//     entityX + entityW >= camMinX - padding &&
//     entityX <= camMaxX + padding &&
//     entityY + entityH >= camMinY - padding &&
//     entityY <= camMaxY + padding
//   );
// }

// /**
//  * Calculates a padded Axis-Aligned Bounding Box (AABB) for a centered camera.
//  * Modifies an output array or returns primitive values via tuple/destructuring.
//  * Zero object allocations.
//  */
// export function getCameraBounds(
//   posX: number,
//   posY: number,
//   width: number,
//   height: number,
//   padding: number
// ) {
//   const halfW = width * 0.5;
//   const halfH = height * 0.5;

//   return {
//     minX: posX - halfW - padding,
//     minY: posY - halfH - padding,
//     maxX: posX + halfW + padding,
//     maxY: posY + halfH + padding,
//   };
// }
