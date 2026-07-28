function intersects(
  aMinX: number,
  aMinY: number,
  aMaxX: number,
  aMaxY: number,
  bMinX: number,
  bMinY: number,
  bMaxX: number,
  bMaxY: number
): boolean {
  return !(aMaxX < bMinX || aMinX > bMaxX || aMaxY < bMinY || aMinY > bMaxY);
}

/**
 * Checks if an entity's AABB intersects with a camera's precalculated AABB.
 * Zero object allocations.
 */
export function isEntityInCamera(
  camMinX: number,
  camMinY: number,
  camMaxX: number,
  camMaxY: number,
  entX: number,
  entY: number,
  entW: number = 0,
  entH: number = 0
): boolean {
  const entMaxX = entX + entW;
  const entMaxY = entY + entH;

  return intersects(
    camMinX,
    camMinY,
    camMaxX,
    camMaxY,
    entX,
    entY,
    entMaxX,
    entMaxY
  );
}
