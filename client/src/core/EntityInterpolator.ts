export interface PositionSnapshot {
  timestamp: number;
  x: number;
  y: number;
}

export class EntityInterpolator {
  private buffers = new Map<number, PositionSnapshot[]>();
  private readonly MAX_BUFFER_SIZE = 10;

  /**
   * Pushes incoming server snapshots into the entity's time buffer
   */
  public pushSnapshot(
    entityId: number,
    x: number,
    y: number,
    timestamp: number = performance.now()
  ): void {
    let buffer = this.buffers.get(entityId);

    if (!buffer) {
      buffer = [];
      this.buffers.set(entityId, buffer);
    }

    // Ignore out-of-order or duplicate timestamp packets
    if (buffer.length > 0 && timestamp <= buffer[buffer.length - 1].timestamp) {
      return;
    }

    buffer.push({ timestamp, x, y });

    if (buffer.length > this.MAX_BUFFER_SIZE) {
      buffer.shift();
    }
  }

  /**
   * Smoothly interpolates entity coordinates based on render time
   */
  public interpolate(
    entities: Map<number, { position: { x: number; y: number } }>,
    renderDelayMs: number = 100
  ): void {
    const renderTime = performance.now() - renderDelayMs;

    for (const [entityId, entity] of entities.entries()) {
      const buffer = this.buffers.get(entityId);
      if (!buffer || buffer.length === 0) continue;

      // 1. Single snapshot fallback
      if (buffer.length === 1) {
        entity.position.x = buffer[0].x;
        entity.position.y = buffer[0].y;
        continue;
      }

      // 2. Prune obsolete snapshots past the render window
      while (buffer.length > 2 && buffer[1].timestamp <= renderTime) {
        buffer.shift();
      }

      const p0 = buffer[0];
      const p1 = buffer[1];

      // 3. Teleport Protection (> 150px jump)
      const deltaX = p1.x - p0.x;
      const deltaY = p1.y - p0.y;
      if (Math.hypot(deltaX, deltaY) > 150) {
        entity.position.x = p1.x;
        entity.position.y = p1.y;
        buffer.shift();
        continue;
      }

      // 4. Smooth Lerp
      if (renderTime >= p0.timestamp && renderTime <= p1.timestamp) {
        const total = p1.timestamp - p0.timestamp;
        const current = renderTime - p0.timestamp;
        const alpha = total > 0 ? current / total : 1;

        entity.position.x = p0.x + deltaX * alpha;
        entity.position.y = p0.y + deltaY * alpha;
      } else if (renderTime > p1.timestamp) {
        // 5. Soft Extrapolation / Clamping when ahead of server updates
        const timePassed = renderTime - p1.timestamp;

        // Smoothly move toward latest position without sudden snaps
        entity.position.x += (p1.x - entity.position.x) * 0.2;
        entity.position.y += (p1.y - entity.position.y) * 0.2;
      }
    }
  }

  public removeEntity(entityId: number): void {
    this.buffers.delete(entityId);
  }

  public clear(): void {
    this.buffers.clear();
  }
}
