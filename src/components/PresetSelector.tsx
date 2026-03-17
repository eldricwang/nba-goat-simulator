import type { WeightPreset } from "../types/weights";

interface PresetSelectorProps {
  presets: WeightPreset[];
  onSelect: (preset: WeightPreset) => void;
  activePreset: string | null;
}

export default function PresetSelector({
  presets,
  onSelect,
  activePreset,
}: PresetSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {presets.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset)}
          className={`p-3 rounded-xl text-left transition-all duration-200 border
            ${
              activePreset === preset.name
                ? "bg-orange-500/20 border-orange-500 shadow-lg shadow-orange-500/10"
                : "bg-gray-800/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800"
            }`}
        >
          <div className="text-xl mb-1">{preset.emoji}</div>
          <div className="text-sm font-bold text-white">{preset.name}</div>
          <div className="text-xs text-gray-400 mt-1">{preset.description}</div>
        </button>
      ))}
    </div>
  );
}