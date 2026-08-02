import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { SHARED_ROOT_PATH } from "~/shared/core/constants";

import Area from "~/core/Area";
import Npc from "~/core/Npc";
import Zone from "~/core/Zone";
import { Log } from "~/shared/core/Logger";
// import { getActsPath, getAreaPath, getZonePath } from "~/utils/fetch-helpers";

import type { Act } from "~/core/ActsManager";
import type { Entity } from "~/shared/core/types";

export interface WorldData {
  name: string;
  areas: Map<string, Area>;
  zones: Map<string, Zone>;
  entities: Map<number, Entity>;
  actsRegistry: Map<string, Act>;
}

const rootPath = path.resolve(process.cwd(), SHARED_ROOT_PATH);

export const getAreaPath = (areaPath: string): string =>
  path.join(rootPath, areaPath);

export const getZonePath = (areaId: string, zonePath: string): string =>
  path.join(rootPath, areaId, "zones", zonePath);

export const getActsPath = (areaId: string): string =>
  path.join(rootPath, areaId, "acts.ts");

export async function fetchWorld(configFilePath: string): Promise<WorldData> {
  try {
    const rawData = readFileSync(configFilePath, "utf-8");
    const { name, areas: areaConfigs } = JSON.parse(rawData);

    const areas = new Map<string, Area>();
    const zones = new Map<string, Zone>();
    const entities = new Map<number, Entity>();
    const actsRegistry = new Map<string, Act>();

    for (const { areaPath } of areaConfigs) {
      const areaData = JSON.parse(readFileSync(getAreaPath(areaPath), "utf-8"));
      const area = new Area(areaData);
      let zone = null;
      Log.WORLD.INFO(`${area.name} initializing...`);
      for (const [index, zoneConfig] of areaData.zones.entries()) {
        if (!zoneConfig) continue;
        const isLast = index === areaData.zones.length - 1;
        const branchChar = isLast ? "└──" : "├──";
        const zoneData = JSON.parse(
          await readFile(getZonePath(area.id, zoneConfig.zonePath), "utf-8")
        );
        zone = new Zone(zoneData);
        area.addZone(zone);
        zones.set(zone.id, zone);
        Log.WORLD.INFO(
          `${branchChar} ${zone.name}: ${zone.cols}x${zone.rows}, ${zone.totalBuckets} buckets.`
        );
        for (const npcData of areaData.npcs) {
          const npc = new Npc(npcData);
          entities.set(npc.id, npc);
        }
        areas.set(areaData.id, area);

        const actsPath = getActsPath(area.id);
        if (!existsSync(actsPath)) continue;

        const actModule = pathToFileURL(actsPath).href;
        const { acts } = await import(actModule);
        if (!acts) continue;

        for (const [key, actFn] of Object.entries(acts)) {
          const actKey = `${area.id}:${key}`;
          actsRegistry.set(actKey, actFn as Act);
        }
      }
    }

    return { name, areas, zones, entities, actsRegistry };
  } catch (error) {
    Log.WORLD.ERROR(`Failed world configuration generation: ${error}`);
    throw error;
  }
}
