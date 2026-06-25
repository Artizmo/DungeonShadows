import type Character from "~/character/Character";

interface CharacterSelectionProps {
  characters: Character[];
  selectedCharId: number | null;
  onSelectCharacter: (id: number) => void;
  onBack: () => void;
  onLaunch: () => void;
}

export default function CharacterSelectionForm({
  characters,
  selectedCharId,
  onSelectCharacter,
  onBack,
  onLaunch,
}: CharacterSelectionProps) {
  return (
    <div className="space-y-6 relative">
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Available Characters ({characters.length})
        </label>

        <div className="space-y-2.5 max-h-65 overflow-y-auto pr-1">
          {characters.map((char) => {
            const isSelected = selectedCharId === char.id;
            return (
              <div
                key={char.id}
                onClick={() => onSelectCharacter(char.id)}
                className={`w-full p-4 rounded-xl border text-left cursor-pointer transition flex justify-between items-center ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500 shadow-xl"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="font-bold text-slate-100 flex items-center gap-2">
                    {char.name}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Level: {char.level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    ID: {char.id} • HP: {char.stats.hp}/{char.stats.maxHp}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected ? "border-indigo-500 bg-indigo-600" : "border-slate-700"}`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          onClick={onBack}
          className="px-4 py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium rounded-lg text-sm transition"
        >
          Back
        </button>

        <button
          onClick={onLaunch}
          disabled={!selectedCharId}
          className="flex-1 py-3 bg-linear-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 text-white font-extrabold tracking-wide rounded-lg transition text-sm uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-red-900/20"
        >
          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Play the Game!
          </span>
          <img
            src="/logo.webp"
            alt="Arena Logo"
            className="w-5 h-5 object-contain"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </button>
      </div>
    </div>
  );
}
