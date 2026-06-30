import { Serialize } from "~/shared/serialize/serializer.js";
import { Deserialize } from "~/shared/serialize/deserializer.js";

// // 1. Create a dummy test payload
// const testEvents = [
//   {
//     type: "SPAWN",
//     sequenceId: 1,
//     character: {
//       id: 457,
//       name: "Player 1",
//       level: 1,
//       isAlive: true,
//       position: { x: 10, y: 20 },
//       player: {
//         id: 1,
//         firstName: "John",
//         lastName: "Doe",
//         email: "j@test.com",
//       },
//       zone: { id: "z1", areaId: "a1", mapPath: "test.map" },
//       stats: { hp: 100, maxHp: 100, mana: 50, maxMana: 50, speed: 5 },
//     },
//   },
// ];

// // 2. Serialize to bytes
// const bytes = Serialize.packet(100, testEvents);
// console.log(`✅ Serialized packet size: ${bytes.length} bytes`);

// // 3. Deserialize and verify
// Deserialize.packet(bytes, {
//   onEntitySpawn: (payload) => {
//     console.log(
//       "🚀 Deserialization successful! Spawned character:",
//       payload.name,
//     );
//   },
// });

// import { Serialize } from "./GameSerializer";
// import { Deserialize } from "./deserializer";

// 1. Simulate a dummy 16x16 pixel WebP/PNG chunk (random byte data)
// const mockImageBytes = new Uint8Array([
//   0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
// ]);

// const chunkData = {
//   type: "MAP_CHUNK",
//   x: 5,
//   y: 12,
//   imageBytes: mockImageBytes,
// };

// // 2. Serialize: Bundle it into the unified Packet
// const bytes = Serialize.packet(101, [chunkData]);
// console.log(`📦 Serialized Map Packet Size: ${bytes.length} bytes`);

// // 3. Deserialize: Verify the round-trip
// Deserialize.packet(bytes, {
//   onMapChunk: (payload) => {
//     console.log("✅ MapChunk Received!");
//     console.log(`   Coords: [${payload.x}, ${payload.y}]`);
//     console.log(`   Buffer Length: ${payload.imageBytes.length}`);

//     // Verify data integrity
//     const match = payload.imageBytes.every(
//       (val: number, i: number) => val === mockImageBytes[i],
//     );
//     console.log(`   Integrity Check: ${match ? "PASSED 🟢" : "FAILED 🔴"}`);
//   },
// });

// 1. Simulate a batch of 3 actions (as per your natural tick loop design)
const batch = [
  { type: "MOVE", sequenceId: 101, w: true, s: false, a: false, d: false },
  { type: "MOVE", sequenceId: 102, w: true, s: false, a: false, d: true },
  { type: "MOVE", sequenceId: 103, w: false, s: false, a: false, d: true },
];

// 2. Serialize: Pack the batch into the master GamePacket
const bytes = Serialize.packet(batch);
console.log(`📦 Serialized Client Batch Size: ${bytes.length} bytes`);

// 3. Deserialize: Verify the round-trip and sequence tracking
let processedCount = 0;
Deserialize.packet(bytes, {
  onMoveInput: (payload, sequenceId) => {
    processedCount++;
    console.log(`✅ Input Action #${processedCount} processed:`);
    console.log(`   Sequence: ${sequenceId}`);
    console.log(
      `   Keys: W:${payload.w} A:${payload.a} S:${payload.s} D:${payload.d}`,
    );
  },
});
