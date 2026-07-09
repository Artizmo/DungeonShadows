import { GameProtocol } from "~/shared/network/generated/index.js";
import type { ActionHandler } from "~/shared/core/types.js";
import { GAME_CONFIG } from "~/shared/core/constants.js";

export const ActionRegistry = new Map<GameProtocol.ActionType, ActionHandler>();

ActionRegistry.set(GameProtocol.ActionType.MOVE, {
  validate(entity, payload, dt, world) {
    if (dt <= 0 || dt > 0.2) return false;
    if (typeof payload.x !== "number" || typeof payload.y !== "number")
      return false;
    return true;
  },
  execute(entity, payload, dt, world) {
    this.update!(entity, payload, dt, world);
  },
  update(entity, payload, dt, world) {
    const px = payload.x || 0;
    const py = payload.y || 0;
    if (px === 0 && py === 0) return; // Optimization: Skip math if stationary

    const length = Math.sqrt(px * px + py * py);
    const dx = px / length;
    const dy = py / length;

    entity.x += dx * GAME_CONFIG.SPEED * dt;
    entity.y += dy * GAME_CONFIG.SPEED * dt;

    entity.x = Math.max(10, Math.min(590, entity.x));
    entity.y = Math.max(10, Math.min(390, entity.y));

    entity.x = Math.round(entity.x * 1000) / 1000;
    entity.y = Math.round(entity.y * 1000) / 1000;

    world.markDirty(entity.id);
  },
  reconcile(entity, payload, dt, world) {
    this.update(entity, payload, dt, world);
  },
});

ActionRegistry.set(GameProtocol.ActionType.CAST, {
  validate(entity, payload, dt, world) {
    if (entity.mana < 20 || !payload.targetId) return false;
    const target = world.get(payload.targetId);
    if (!target || target.health <= 0) return false;
    if (entity.areaId !== target.areaId || entity.zoneId !== target.zoneId)
      return false;
    return true;
  },
  execute(entity, payload, dt, world) {
    this.update(entity, payload, dt, world);
    entity.lastCastTimestamp = performance.now();
  },
  update(entity, payload, dt, world) {
    if (entity.mana < 20 || !payload.targetId) return;
    const target = world.get(payload.targetId);
    if (!target || target.health <= 0) return;

    entity.mana -= 20;
    target.health = Math.max(0, target.health - 25);
    entity.mana = Math.max(0, entity.mana);

    world.markDirty(entity.id);
    world.markDirty(target.id);
  },
  reconcile(entity, payload, dt, world) {
    this.update(entity, payload, dt, world);
  },
});
