import path from "path";
import fs from "fs/promises";
import Character from "~/core/Character";
import Player from "~/core/Player";
import type { PlayerRecord } from "data/mock/mock";
import { Log } from "~/shared/core/Logger";

export async function fetchCharacter(characterId: number): Promise<Character> {
  if (!characterId) {
    throw "Invalid character identifier.";
  }

  const filePath = path.resolve(
    process.cwd(),
    `data/characters/${characterId}.json`,
  );
  const fileContent = await fs.readFile(filePath, "utf-8");
  const characterRecord = JSON.parse(fileContent);
  const character = new Character(characterRecord);

  if (!character) {
    Log.SERVER.ERROR(`No data for characterId ${characterId}`);
    throw "Character data not found in file!";
  }

  return character;
}

export async function fetchPlayer(playerId: number): Promise<Player> {
  if (!playerId) {
    throw "Invalid character identifier!";
  }

  const filePath = path.resolve(process.cwd(), `data/players/${playerId}.json`);
  const fileContent = await fs.readFile(filePath, "utf-8");
  const playerRecord: PlayerRecord = JSON.parse(fileContent);

  if (!playerId) {
    Log.SERVER.ERROR(`No data for playerId ${playerId}`);
    throw "Player data not found in file.";
  }

  return new Player(playerRecord);
}

export async function fetchZoneMap() {
  const mapPath = path.resolve(
    process.cwd(),
    `data/world/areas/sephus/zones/arena.webp`,
  );
  const mapBuffer = await fs.readFile(mapPath);

  return mapBuffer.toString("base64");
}
