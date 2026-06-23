import fs from "fs/promises";

export default async function getLocalFile<T>(path: string): Promise<T | null> {
  try {
    const rawData = await fs.readFile(path, "utf-8");
    return JSON.parse(rawData) as T;
  } catch (error) {
    console.error(
      `Game failed to fetch or parse config data from ${path}:`,
      error,
    );
    return null;
  }
}
