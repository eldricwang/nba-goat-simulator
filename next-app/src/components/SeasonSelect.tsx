"use client";

interface SeasonSelectProps {
  seasons: string[];
  selected: string | null;
  onSelect: (season: string) => void;
  label: string;
  accentClass?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function SeasonSelect({
  seasons,
  selected,
  onSelect,
  label,
  accentClass = "text-slate-600",
  disabled = false,
  placeholder = "选择赛季",
}: SeasonSelectProps) {
  const noData = !disabled && seasons.length === 0;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-medium whitespace-nowrap ${
          disabled ? "text-slate-300" : accentClass
        }`}
      >
        {label}
      </span>
      <select
        value={selected ?? ""}
        onChange={(e) => onSelect(e.target.value)}
        disabled={disabled || noData}
        className={`flex-1 rounded-xl px-3 py-1.5 text-sm outline-none transition-all appearance-none ${
          disabled || noData
            ? "bg-slate-50 border border-slate-150 text-slate-300 cursor-not-allowed"
            : "bg-white border border-slate-200 text-slate-700 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        }`}
      >
        <option value="" disabled className="bg-white">
          {disabled
            ? "请先选择球员"
            : noData
            ? "该球员暂无赛季数据"
            : placeholder}
        </option>
        {seasons.map((s) => (
          <option key={s} value={s} className="bg-white">
            {s}
          </option>
        ))}
      </select>
    </div>
  );
}
