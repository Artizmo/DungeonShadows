import type Character from "~/core/Character";
import { useGame } from "~/hooks/useGame";

interface GameHudProps {
  playerId: number;
  characterId: number;
}

type FilteredStats = Pick<Character["stats"], "hp" | "maxHp">;

export default function GameHud({ playerId, characterId }: GameHudProps) {
  const { stats } = useGame<{ stats: FilteredStats | null }>((game) => {
    const liveStats = game.character?.stats;

    // 1. Strict Guard: If the engine is booting, or stats don't exist yet, return null
    if (!game.isReady || !liveStats || typeof liveStats.hp === "undefined") {
      return { stats: null };
    }

    // 2. Safe return: We are 100% sure real data is here
    return {
      stats: {
        hp: liveStats.hp,
        maxHp: liveStats.maxHp,
      },
    };
  });

  if (!stats) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded backdrop-blur-sm shadow-xl text-white">
          <h1 className="text-xl font-bold tracking-tight text-red-500">
            Dungeon Shadows
          </h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">
            Active Connection Profile
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            PID: {playerId || "Unselected"} | CID: {characterId || "Unselected"}
          </p>
        </div>
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded backdrop-blur-sm text-yellow-500 font-semibold text-sm">
          ☀️ Daytime (Clear)
        </div>
        <div className="bg-slate-950/80 border border-slate-800 px-4 py-2 rounded backdrop-blur-sm text-yellow-500 font-semibold text-sm">
          Hp: {stats.hp}/{stats.maxHp}
        </div>
      </div>
      <div className="w-full max-w-2xl mx-auto bg-slate-950/90 border border-slate-800 p-4 rounded backdrop-blur-md shadow-2xl pointer-events-auto">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Enter command... (e.g., 'use match fireplace')"
            className="flex-1 bg-slate-900 border border-slate-700 px-4 py-2 text-white rounded focus:outline-none focus:border-red-500 transition-colors"
          />
          <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded transition-colors shadow-lg">
            Submit
          </button>
        </div>
      </div> */}
    </div>
  );
}
