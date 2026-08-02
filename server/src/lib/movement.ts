import type { Vector2D } from "~/shared/core/types";

/**
 * Calculates normalized 2D movement velocity
 */
export function calculateVelocity(
  directionVector: Vector2D,
  speed: number,
  deltaTime: number
): Vector2D {
  const length = Math.hypot(directionVector.x, directionVector.y);

  if (length > 0) {
    directionVector.x /= length;
    directionVector.y /= length;
  }

  return {
    x: directionVector.x * deltaTime * speed,
    y: directionVector.y * deltaTime * speed,
  };
}
