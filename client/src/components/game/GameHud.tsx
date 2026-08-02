import { useGame } from "~/hooks/useGame";
import { GameClock } from "./GameClock";

export default function GameHud() {
  const name = useGame((game) => game.world.character?.name ?? "");
  const posX = useGame((game) => game.world.character?.position.x ?? 0);
  const posY = useGame((game) => game.world.character?.position.y ?? 0);
  const currentBucketId = useGame(
    (game) => game.world.character?.currentBucketId ?? ""
  );

  const cameraWidth = useGame((game) => game.world.character?.cameraWidth);
  const cameraHeight = useGame((game) => game.world.character?.cameraHeight);
  const AOIBucketKeys = useGame((game) => game.world.character?.AOIBucketKeys);
  const zoneName = useGame((game) => game.world.character?.zone?.name ?? "");

  const isReady = name.length > 0;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6
        transition-opacity duration-1000 ease-in-out
        ${isReady ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
    >
      <div className="w-full flex justify-between items-start">
        <div className="w-[24rem] bg-slate-950/80 border border-slate-800 p-4 rounded backdrop-blur-sm shadow-xl text-white">
          <h1 className="text-xl font-bold tracking-tight text-red-500">
            Dungeon Shadows
          </h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-wider mt-1">
            Active Connection Profile
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            Name: {name}
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            Camera: {cameraWidth}, {cameraHeight}
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            Zone: {zoneName}
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            ┗━ Position: {posX}, {posY}
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            ┗━ Bucket: {currentBucketId}
          </p>
          <p className="text-xs text-indigo-400 font-mono mt-0.5">
            ┗━ AOI Buckets: {AOIBucketKeys?.length}
          </p>
        </div>

        <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800 px-4 py-2 rounded backdrop-blur-sm text-yellow-500 font-semibold text-sm">
          <div>☀️ Daytime (Clear)</div>
          <div>
            <GameClock />
          </div>
        </div>
      </div>
    </div>
  );
}
