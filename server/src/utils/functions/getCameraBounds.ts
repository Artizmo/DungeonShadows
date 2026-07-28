/**
 * Calculates a padded Axis-Aligned Bounding Box (AABB) for a centered camera.
 * Modifies an output array or returns primitive values via tuple/destructuring.
 * Zero object allocations.
 */
export function getCameraBounds(
  posX: number,
  posY: number,
  width: number,
  height: number,
  padding: number
) {
  const halfW = width * 0.5;
  const halfH = height * 0.5;

  return {
    minX: posX - halfW - padding,
    minY: posY - halfH - padding,
    maxX: posX + halfW + padding,
    maxY: posY + halfH + padding,
  };
}
