import { useGame } from "~/hooks/useGame";
import { GameClock } from "./GameClock";

export default function GameHud() {
  const name = useGame<string>((game) => game.character?.name ?? "");
  const isReady = name.length > 0;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6
        transition-opacity duration-1000 ease-in-out
        ${isReady ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
    >
      <div className="w-full flex justify-between items-start">
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded backdrop-blur-sm shadow-xl text-white">
          <h1 className="text-xl font-bold tracking-tight text-red-500">
            Dungeon Shadows
          </h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">
            Active Connection Profile
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            Name: {name}
          </p>
        </div>
        <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800 px-4 py-2 rounded backdrop-blur-sm text-yellow-500 font-semibold text-sm">
          <div>☀️ Daytime (Clear)</div>
          <div>
            <GameClock />
          </div>
        </div>
      </div>
      <div className="w-full max-w-2xl mx-auto bg-slate-950/90 border border-slate-800 p-4 rounded backdrop-blur-md shadow-2xl">
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
      </div>
    </div>
  );
}
