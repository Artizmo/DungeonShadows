import * as fs from 'fs/promises';
import * as path from 'path';
import type Character from './Character';

export default class Save {
  private readonly baseDir = path.join(process.cwd(), 'src', 'data', 'saved', 'characters');

  public async saveCharacter(character: Character): Promise<void> {
    const id = character.id;
    if (id === undefined || id === null) {
      throw new Error(`The character instance "${character.name}" is missing a valid ID.`);
    }

    try {
      await fs.mkdir(this.baseDir, { recursive: true });

      const filePath = path.join(this.baseDir, `${id}.json`);
      const payload = {
        id,
        name: character.name,
        isDead: character.isDead,
        stats: character.stats,
        inventory: character.inventory,
        updatedAt: new Date().toISOString()
      };

      await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      throw new Error(`File System operation failed: ${(e as Error).message}`);
    }
  }
}