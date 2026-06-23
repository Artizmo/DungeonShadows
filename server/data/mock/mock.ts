import type Character from "~/core/Character";

export const playersData = new Map<number, PlayerRecord>([
  [
    1,
    {
      id: 1,
      firstName: "Luke",
      lastName: "Skywalker",
      email: "luke.skywalker@tatooine.net",
    },
  ],
  [
    2,
    {
      id: 2,
      firstName: "Leia",
      lastName: "Organa",
      email: "leia.organa@alderaan.gov",
    },
  ],
  [
    3,
    {
      id: 3,
      firstName: "Brian",
      lastName: "Selvaggio",
      email: "selvaggio@smugglers.org",
    },
  ],
  [
    4,
    {
      id: 4,
      firstName: "Lando",
      lastName: "Calrissian",
      email: "lando.c@cloudcity.io",
    },
  ],
  [
    5,
    {
      id: 5,
      firstName: "Obi-Wan",
      lastName: "Kenobi",
      email: "ben.kenobi@jediorder.org",
    },
  ],
  [
    6,
    {
      id: 6,
      firstName: "Mace",
      lastName: "Windu",
      email: "mace.windu@jedi-council.org",
    },
  ],
  [
    7,
    {
      id: 7,
      firstName: "Ahsoka",
      lastName: "Tano",
      email: "snips@fulcrum.net",
    },
  ],
  [
    8,
    {
      id: 8,
      firstName: "Din",
      lastName: "Djarin",
      email: "mando@bountyhunters.guild",
    },
  ],
  [
    9,
    {
      id: 9,
      firstName: "Boba",
      lastName: "Fett",
      email: "boba.fett@kamino.com",
    },
  ],
  [
    10,
    {
      id: 10,
      firstName: "Cassian",
      lastName: "Andor",
      email: "c.andor@rebellion.agency",
    },
  ],
]);

export const charactersData = new Map<number, CharacterRecord>([
  [
    456,
    {
      id: 456,
      playerId: 3,
      name: "Brytagg, the Grim",
      isDead: false,
      inventory: ["rusty_dagger", "health_potion"],
      stats: { hp: 100, maxHp: 100, mana: 20, maxMana: 50, speed: 4 },
      level: (456 % 30) + 1,
    },
  ],
  [
    457,
    {
      id: 457,
      playerId: 1,
      name: "Eldrin Sunstrider",
      isDead: false,
      inventory: ["wooden_staff", "mana_potion"],
      stats: { hp: 80, maxHp: 80, mana: 150, maxMana: 150, speed: 5 },
      level: (457 % 30) + 1,
    },
  ],
  [
    458,
    {
      id: 458,
      playerId: 7,
      name: "Thorgar Ironbreaker",
      isDead: false,
      inventory: ["iron_axe", "ale"],
      stats: { hp: 150, maxHp: 150, mana: 10, maxMana: 10, speed: 3 },
      level: (458 % 30) + 1,
    },
  ],
  [
    459,
    {
      id: 459,
      playerId: 5,
      name: "Lyra Swiftwind",
      isDead: false,
      inventory: ["short_bow", "arrow_twenty"],
      stats: { hp: 90, maxHp: 90, mana: 30, maxMana: 30, speed: 6 },
      level: (459 % 30) + 1,
    },
  ],
  [
    460,
    {
      id: 460,
      playerId: 9,
      name: "Valerius the Pure",
      isDead: false,
      inventory: ["iron_sword", "kite_shield"],
      stats: { hp: 120, maxHp: 120, mana: 60, maxMana: 60, speed: 4 },
      level: (460 % 30) + 1,
    },
  ],
  [
    461,
    {
      id: 461,
      playerId: 2,
      name: "Morwenna Darkweaver",
      isDead: true,
      inventory: ["bone_wand"],
      stats: { hp: 0, maxHp: 75, mana: 0, maxMana: 200, speed: 4 },
      level: (461 % 30) + 1,
    },
  ],
  [
    462,
    {
      id: 462,
      playerId: 8,
      name: "Garrick Stonefist",
      isDead: false,
      inventory: ["leather_wraps"],
      stats: { hp: 130, maxHp: 130, mana: 0, maxMana: 0, speed: 4 },
      level: (462 % 30) + 1,
    },
  ],
  [
    463,
    {
      id: 463,
      playerId: 4,
      name: "Seraphina Frosthale",
      isDead: false,
      inventory: ["ice_shard", "scroll_of_teleport"],
      stats: { hp: 85, maxHp: 85, mana: 100, maxMana: 100, speed: 5 },
      level: (463 % 30) + 1,
    },
  ],
  [
    464,
    {
      id: 464,
      playerId: 10,
      name: "Zephyrus Stormborn",
      isDead: false,
      inventory: ["thunder_strike"],
      stats: { hp: 110, maxHp: 110, mana: 80, maxMana: 80, speed: 5 },
      level: (464 % 30) + 1,
    },
  ],
  [
    465,
    {
      id: 465,
      playerId: 6,
      name: "Isolde Autumnvale",
      isDead: false,
      inventory: ["hunting_knife", "herbs"],
      stats: { hp: 95, maxHp: 95, mana: 70, maxMana: 70, speed: 5 },
      level: (465 % 30) + 1,
    },
  ],
]);

export function getCharactersByPlayerId(playerId: number): CharacterRecord[] {
  return Array.from(charactersData.values()).filter(
    (character) => character.playerId === playerId,
  );
}

export function getCharacterById(
  characterId: number,
  playerId: number,
): CharacterRecord {
  const characters = getCharactersByPlayerId(playerId);
  if (!characters.length) return;

  return characters.find(
    (character: CharacterRecord) => character.id === characterId,
  );
}

export interface PlayerRecord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface CharacterRecord {
  position?: { x: number; y: number };
  playerId: number;
  id: number;
  name: string;
  isDead: boolean;
  inventory: string[];
  stats: Stats;
  level: number;
}

interface Stats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  speed: number;
}
