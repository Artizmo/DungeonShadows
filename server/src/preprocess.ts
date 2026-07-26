import sharp from "sharp";
import * as fs from "node:fs/promises";
import * as path from "path";

/**
 * 1. Chunks an image and saves individual files.
 * @returns {Promise<{ totalChunks: number, width: number, height: number }>}
 */
async function chunkImage(inputImagePath, outputDir) {
  await fs.mkdir(outputDir, { recursive: true });

  const image = sharp(inputImagePath);
  const { width, height } = await image.metadata();
  const CHUNK_SIZE = 256;

  const chunkPromises = []; // Array to store our unresolved extraction promises

  if (width < CHUNK_SIZE && height < CHUNK_SIZE) {
    const left = Math.floor((CHUNK_SIZE - width) / 2);
    const top = Math.floor((CHUNK_SIZE - height) / 2);

    const promise = sharp({
      create: {
        width: CHUNK_SIZE,
        height: CHUNK_SIZE,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: inputImagePath, top, left }])
      .toFile(path.join(outputDir, "0_0.webp"));

    chunkPromises.push(promise);
  } else {
    for (let y = 0; y < height; y += CHUNK_SIZE) {
      for (let x = 0; x < width; x += CHUNK_SIZE) {
        const chunkWidth = Math.min(CHUNK_SIZE, width - x);
        const chunkHeight = Math.min(CHUNK_SIZE, height - y);

        // 🟢 Convert pixel offset to Grid Index (0, 1, 2...)
        const gridX = x / CHUNK_SIZE;
        const gridY = y / CHUNK_SIZE;

        // 🟢 Save using grid coordinates (e.g., "0_1.webp")
        const promise = image
          .clone()
          .extract({ left: x, top: y, width: chunkWidth, height: chunkHeight })
          .toFile(path.join(outputDir, `${gridX}_${gridY}.webp`));

        chunkPromises.push(promise);
      }
    }
    for (let y = 0; y < height; y += CHUNK_SIZE) {
      for (let x = 0; x < width; x += CHUNK_SIZE) {
        const chunkWidth = Math.min(CHUNK_SIZE, width - x);
        const chunkHeight = Math.min(CHUNK_SIZE, height - y);

        // 🟢 Convert pixel offset to Grid Index (0, 1, 2...)
        const gridX = x / CHUNK_SIZE;
        const gridY = y / CHUNK_SIZE;

        // 🟢 Save using grid coordinates (e.g., "0_1.webp")
        const promise = image
          .clone()
          .extract({ left: x, top: y, width: chunkWidth, height: chunkHeight })
          .toFile(path.join(outputDir, `${gridX}_${gridY}.webp`));

        chunkPromises.push(promise);
      }
    }
  }

  // Execute all chunk generations in parallel across CPU threads
  await Promise.all(chunkPromises);

  return {
    totalChunks: chunkPromises.length,
    width,
    height,
  };
}

/**
 * 2. Updates the existing zone JSON file with new map metadata.
 */
async function updateZoneJson(jsonPath, chunkResult) {
  // Read and parse current JSON data
  const jsonRaw = await fs.readFile(jsonPath, "utf8");
  const jsonData = JSON.parse(jsonRaw);

  // Initialize map object if it somehow doesn't exist
  if (!jsonData.map) {
    jsonData.map = {};
  }

  // Inject/Update the requested properties inside the map object
  jsonData.map.width = chunkResult.width;
  jsonData.map.height = chunkResult.height;
  jsonData.map.totalChunks = chunkResult.totalChunks;
  jsonData.map.lastProcessedDate = new Date().toISOString();

  // Write the updated object back to the original file path
  await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 4), "utf8");
}

/**
 * 3. Main process orchestrator
 */
async function processAreas(basePath = "../shared/data/world/areas") {
  try {
    const areas = await fs.readdir(basePath, { withFileTypes: true });

    for (const area of areas) {
      if (!area.isDirectory()) continue;

      const zonesPath = path.join(basePath, area.name, "zones");

      try {
        await fs.access(zonesPath);
      } catch {
        console.warn(`No 'zones' directory found for area: ${area.name}`);
        continue;
      }

      const zones = await fs.readdir(zonesPath, { withFileTypes: true });

      for (const zone of zones) {
        if (!zone.isDirectory()) continue;

        const zoneDir = path.join(zonesPath, zone.name);
        const jsonPath = path.join(zoneDir, `${zone.name}.json`);

        try {
          const jsonRaw = await fs.readFile(jsonPath, "utf8");
          const jsonData = JSON.parse(jsonRaw);
          const mapName = jsonData?.map?.file;

          if (!mapName) {
            console.error(`Missing 'map.mapName' in ${jsonPath}`);
            continue;
          }

          const imagePath = path.resolve(zoneDir, mapName);
          const chunksOutputDir = path.join(zoneDir, "chunks");

          console.log(`🌳 Processing Zone: ${zone.name}`);

          // 1. Process image chunks
          const chunkResult = await chunkImage(imagePath, chunksOutputDir);

          // 2. Overwrite the zone JSON file directly with the updated schema
          await updateZoneJson(jsonPath, chunkResult);

          console.log(`-> Updated ${zone.name}.json successfully.`);
        } catch (err) {
          console.error(`Failed to process zone at ${jsonPath}:`, err.message);
        }
      }
    }
    console.log("\nAll zones updated successfully.");
  } catch (error) {
    console.error("Fatal directory processing error:", error);
  }
}

// Start the processing loop
processAreas();
