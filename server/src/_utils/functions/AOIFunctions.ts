import { CHUNK_SIZE } from "~/shared/core/constants";

/** Clamps a coordinate within the map boundaries. Mutates the position directly. */
export function clampPosition(
  pos: { x: number; y: number },
  mapW: number,
  mapH: number,
  padding: number = 0
) {
  pos.x = Math.max(padding, Math.min(pos.x, mapW - padding));
  pos.y = Math.max(padding, Math.min(pos.y, mapH - padding));
}

/** Calculates the grid bucket key for a given coordinate */
export function getBucketKey(x: number, y: number): string {
  return `${Math.floor(x / CHUNK_SIZE)}_${Math.floor(y / CHUNK_SIZE)}`;
}

/** Pure math: Returns a Set of all chunk keys visible to the camera's bounding box */
export function calculateAOIBuckets(
  posX: number,
  posY: number,
  camW: number,
  camH: number,
  mapW: number,
  mapH: number,
  bufferRadius: number
): Set<string> {
  const targetCamX = posX - camW / 2;
  const targetCamY = posY - camH / 2;

  const maxCamX = Math.max(0, mapW - camW);
  const maxCamY = Math.max(0, mapH - camH);

  const finalCamX = Math.max(0, Math.min(targetCamX, maxCamX));
  const finalCamY = Math.max(0, Math.min(targetCamY, maxCamY));

  const startX = Math.max(0, Math.floor(finalCamX / CHUNK_SIZE) - bufferRadius);
  const endX = Math.min(
    Math.ceil(mapW / CHUNK_SIZE) - 1,
    Math.ceil((finalCamX + camW) / CHUNK_SIZE) + bufferRadius
  );
  const startY = Math.max(0, Math.floor(finalCamY / CHUNK_SIZE) - bufferRadius);
  const endY = Math.min(
    Math.ceil(mapH / CHUNK_SIZE) - 1,
    Math.ceil((finalCamY + camH) / CHUNK_SIZE) + bufferRadius
  );

  const aoi = new Set<string>();
  for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
      aoi.add(`${x}_${y}`);
    }
  }
  return aoi;
}

/** Finds which chunk keys were removed and which were added */
export function getSetDifferences(
  oldSet: Set<string>,
  newSet: Set<string>
): { removed: string[]; added: string[] } {
  const removed: string[] = [];
  const added: string[] = [];

  for (const item of oldSet) {
    if (!newSet.has(item)) removed.push(item);
  }

  for (const item of newSet) {
    if (!oldSet.has(item)) added.push(item);
  }

  return { removed, added };
}
