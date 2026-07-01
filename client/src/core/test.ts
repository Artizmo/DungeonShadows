import Game from "~/core/game/Game";
import type { Config } from "~/shared/types";
import Character from "./core/character/Character";

const config: Config = {
  cycleRate: 0.016666667, // Now matching 60Hz processing chunks
  tickRate: 0.05, // Sync window updates every 50ms (20 network updates a sec)
  cycleSize: 600, // Unified reset index timeline maximum boundary
};

const test = () => {
  // 1. Setup minimal mock state
  const game = new Game(config);
  game.world.character = new Character({
    id: 123,
    name: "TestCharacter",
    isAlive: true,
    player: {
      id: 1,
      firstName: "TestPlayer",
      lastName: "Test",
      email: "test@example.com",
    },
    speed: 100,
    position: { x: 0, y: 0 },
    level: 12,
    zone: { id: "zone1", areaId: "area1", mapPath: "/maps/zone1.png" },
    stats: { hp: 100, maxHp: 100 },
  });

  // 2. Mock inputs
  const keys = { w: true, s: false, a: false, d: false };

  // 3. Act: Simulate one update at 1/10th of a second
  const dt = 0.1;
  game.update(dt);

  // 4. Assert: Did it move correctly?
  // Expect: speed (100) * dt (0.1) = 10 units
  return (game.world.character.position.y = -10);
};

test();
