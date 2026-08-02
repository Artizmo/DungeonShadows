// import {
//   FLAG_DIRTY,
//   FLAG_POSITION,
//   FLAG_SPAWNED,
// } from "~/shared/core/constants.js";

// export type ActFunction = (entity: any, world: any, deltaTime: number) => void;

// interface WanderState {
//   targetX: number | null;
//   targetY: number | null;
//   waitTime: number;
//   originX: number;
//   originY: number;
// }

// const TILE_SIZE = 16;
// const MAX_TILE_RADIUS = 10;
// const MAX_PIXEL_RADIUS = MAX_TILE_RADIUS * TILE_SIZE; // 160px

// export const acts: Record<string, ActFunction> = {
//   spawn: (entity: any, world: any, deltaTime: number) => {
//     if ((world.entityFlags[entity.id] & FLAG_SPAWNED) !== 0) return;
//     world.spawn(entity);
//   },
//   wander: (entity: any, world: any, deltaTime: number) => {
//     if ((world.entityFlags[entity.id] & FLAG_SPAWNED) === 0) return;

//     if ((world.entityFlags[entity.id] & FLAG_SPAWNED) === 0) return;

//     if (!entity.wanderState) {
//       entity.wanderState = {
//         targetX: null,
//         targetY: null,
//         waitTime: 0,
//         originX: entity.position.x,
//         originY: entity.position.y,
//       };
//     }

//     // 🟢 1. GUARANTEE WANDER STATE PERSISTS ON THE ENTITY OBJECT
//     if (!entity.wanderState) {
//       entity.wanderState = {
//         targetX: null,
//         targetY: null,
//         waitTime: 0,
//         originX: entity.position.x,
//         originY: entity.position.y,
//       };
//     }

//     const state = entity.wanderState;

//     // 🟢 2. PHASE 1: COOLDOWN / PAUSE
//     if (state.waitTime > 0) {
//       state.waitTime -= deltaTime;
//       return; // Do not move or pick targets while waiting!
//     }

//     // 🟢 3. PHASE 2: PICK TARGET (ONLY IF WE DON'T ALREADY HAVE ONE)
//     if (state.targetX === null || state.targetY === null) {
//       const angle = Math.random() * Math.PI * 2;
//       const distance = (Math.random() * 0.7 + 0.3) * MAX_PIXEL_RADIUS;

//       const rawTargetX = state.originX + Math.cos(angle) * distance;
//       const rawTargetY = state.originY + Math.sin(angle) * distance;

//       const zone = world.getZone(entity.zoneId);
//       if (zone) {
//         state.targetX = Math.max(0, Math.min(zone.map.width, rawTargetX));
//         state.targetY = Math.max(0, Math.min(zone.map.height, rawTargetY));
//       } else {
//         state.targetX = rawTargetX;
//         state.targetY = rawTargetY;
//       }
//     }

//     // 🟢 4. PHASE 3: STEP TOWARDS TARGET GRADUALLY
//     const dx = state.targetX - entity.position.x;
//     const dy = state.targetY - entity.position.y;
//     const distanceToTarget = Math.hypot(dx, dy);

//     const speed = entity.speed ?? 32; // 32px per sec
//     const moveStep = speed * deltaTime; // At 20Hz (deltaTime = 0.05), moveStep = 1.6px!

//     if (distanceToTarget <= moveStep) {
//       // Arrived at target!
//       entity.position.x = state.targetX;
//       entity.position.y = state.targetY;

//       // CLEAR TARGET AND WAIT 3-6 SECONDS
//       state.targetX = null;
//       state.targetY = null;
//       state.waitTime = Math.random() * 3 + 3;
//     } else {
//       // Step tiny distance toward target
//       entity.position.x += (dx / distanceToTarget) * moveStep;
//       entity.position.y += (dy / distanceToTarget) * moveStep;
//     }

//     // 🟢 5. MARK FLAGS FOR NETWORK
//     world.entityFlags[entity.id] |= FLAG_DIRTY | FLAG_POSITION;
//   },
// };
