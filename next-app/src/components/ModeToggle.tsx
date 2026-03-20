"use client";

import type { CompareMode } from "@/lib/types";

interface ModeToggleProps {
  mode: CompareMode;
  onChange: (mode: CompareMode) => void;
}

export default function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-0.5 sm:p-1 border border-slate-200">
      <button
        onClick={() => onChange("career")}
        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
          mode === "career"
            ? "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/20"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        生涯对比
      </button>
      <button
        onClick={() => onChange("season")}
        className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
          mode === "season"
            ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        单赛季对比
      </button>
    </div>
  );
}
