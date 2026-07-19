import path from "path";
import fs from "fs/promises";
import { Log } from "~/shared/core/Logger";
import type Character from "~/core/Character";
import Player from "~/core/Player";

export async function fetchCharacter(characterId: number): Promise<Character> {
  if (!characterId) {
    throw new Error("Invalid character identifier.");
  }

  const filePath = path.join(
    process.cwd(),
    `../shared/data/characters/${characterId}.json`,
  );

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const characterRecord = JSON.parse(fileContent);

    if (!characterRecord) {
      Log.NETWORK.ERROR(
        `Character file empty or corrupt for characterId: ${characterId}`,
      );
      throw new Error("Character data corrupt.");
    }

    return characterRecord;
  } catch (error: any) {
    Log.NETWORK.ERROR(
      `Failed to fetch data for characterId ${characterId}: ${error.message}`,
    );
    throw new Error(`Character data not found for ID: ${characterId}`);
  }
}

export async function fetchPlayer(playerId: number): Promise<Player> {
  if (!playerId) {
    throw new Error("Invalid player identifier!");
  }

  const filePath = path.join(
    process.cwd(),
    `../shared/data/players/${playerId}.json`,
  );

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const playerRecord = JSON.parse(fileContent);

    if (!playerRecord) {
      Log.NETWORK.ERROR(
        `Player file empty or corrupt for playerId: ${playerId}`,
      );
      throw new Error("Player data corrupt.");
    }

    return new Player(playerRecord);
  } catch (error: any) {
    Log.NETWORK.ERROR(
      `Failed to fetch data for playerId ${playerId}: ${error.message}`,
    );
    throw new Error(`Player data not found for ID: ${playerId}`);
  }
}
