import { readFileSync } from "node:fs";
import { Log } from "~/shared/core/Logger";
import Area from "~/core/Area";
import Npc from "~/core/Npc";
import Zone from "~/core/Zone";
import type { Act } from "~/core/ActsManager";
import { readFile } from "node:fs/promises";

export interface WorldData {
  name: string;
  areas: Map<string, Area>;
  zones: Map<string, Zone>;
  entities: Map<number, Npc>;
  actsRegistry: Map<string, Act>;
}

export async function fetchWorld(configFilePath: string): Promise<WorldData> {
  try {
    Log.WORLD.INFO("Loading areas, zones, entities, and acts...");
    const rawData = readFileSync(configFilePath, "utf-8");
    const { name, areas: areaConfigs } = JSON.parse(rawData);
    const areas = new Map();
    const zones = new Map();
    const entities = new Map();
    const actsRegistry = new Map();

    for (const { areaPath } of areaConfigs) {
      const areaFullPath = `../shared/data/world/areas/${areaPath}`;
      const areaData = JSON.parse(readFileSync(areaFullPath, "utf-8"));
      const area = new Area(areaData);
      Log.WORLD.INFO(`${area.name} initializing...`);

      for (const [index, zoneConfig] of areaData.zones.entries()) {
        if (!zoneConfig) continue;

        const isLast = index === areaData.zones.length - 1;
        const branchChar = isLast ? "└──" : "├──";
        const zoneData = JSON.parse(
          await readFile(
            `../shared/data/world/areas/${area.id}/zones/${zoneConfig.zonePath}`,
            "utf-8"
          )
        );
        const zone = new Zone(zoneData);
        await zone.initBucketGrid();
        area.addZone(zone);
        zones.set(zone.id, zone);

        Log.WORLD.INFO(
          `${branchChar} ${zone.name}: ${zone.cols}x${zone.rows}, ${zone.buckets.size} buckets.`
        );
      }

      for (const npcData of areaData.npcs) {
        const npc = new Npc(npcData);
        const actModule = await import(
          `~/shared/data/world/areas/${area.id}/acts.ts`
        );

        for (const key in actModule.acts) {
          actsRegistry.set(key, actModule.acts[key]);
        }

        entities.set(npc.id, npc);
      }
      areas.set(areaData.id, area);
    }

    return { name, areas, zones, entities, actsRegistry };
  } catch (error) {
    Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    throw error;
  }
}
