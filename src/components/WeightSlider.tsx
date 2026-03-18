import { WEIGHT_LABELS, WEIGHT_GROUPS } from "../types/weights";
import type { WeightConfig } from "../api";

interface WeightSliderProps {
  weights: WeightConfig;
  onChange: (key: keyof WeightConfig, value: number) => void;
}

export default function WeightSlider({ weights, onChange }: WeightSliderProps) {
  return (
    <div className="space-y-6">
      {WEIGHT_GROUPS.map((group) => (
        <div key={group.name}>
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">
            {group.name}
          </h3>
          <div className="space-y-3">
            {group.keys.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <label className="text-sm text-gray-300 w-44 shrink-0">
                  {WEIGHT_LABELS[key]}
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={weights[key]}
                  onChange={(e) => onChange(key, Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer
                    bg-gray-700 accent-orange-500"
                />
                <span className="text-sm font-mono text-orange-400 w-10 text-right">
                  {weights[key]}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}