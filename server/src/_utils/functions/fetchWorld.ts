import path from "path";
import fs from "fs";
import { Log } from "~/shared/core/Logger";

/**
 * Universally reads, parses, and validates a JSON configuration ledger.
 * @param relativePath Target file path segment (can be absolute or relative)
 * @param basePath Optional base directory to anchor path resolution (defaults to process.cwd())
 * @param errorContext Descriptive tag for cleaner logs (e.g., "master world tree hierarchy")
 */
export function fetchConfigData<T>(
  relativePath: string,
  basePath: string = process.cwd(),
): T {
  // 1. Resolve path cleanly (handles already absolute paths or relative segments)
  const finalPath = path.join(relativePath)
    ? relativePath
    : path.resolve(basePath, relativePath);

  // 2. Fail early if the target ledger file is physically missing
  if (!fs.existsSync(finalPath)) {
    Log.WORLD.ERROR(
      `Master configuration target ledger missing at: ${finalPath}`,
    );
  }

  try {
    // 3. Ingest, parse, and return type-casted layout data
    const raw = fs.readFileSync(finalPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error: any) {
    Log.WORLD.ERROR(`Failed loading from [${relativePath}]: ${error.message}`);
  }
}
