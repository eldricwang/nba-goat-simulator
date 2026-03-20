"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Player } from "@/lib/types";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";

interface PlayerSelectProps {
  players: Player[];
  selected: Player | null;
  onSelect: (player: Player) => void;
  label: string;
  accentClass?: string;
}

function MiniAvatar({ player }: { player: Player }) {
  const [err, setErr] = useState(false);
  const url = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);

  if (url && !err) {
    return (
      <div className="relative w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0">
        <Image
          src={url}
          alt=""
          fill
          className="object-cover object-top scale-125"
          sizes="28px"
          onError={() => setErr(true)}
          unoptimized
        />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function PlayerSelect({
  players,
  selected,
  onSelect,
  label,
  accentClass = "text-red-600",
}: PlayerSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? players.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.nameZh.includes(query) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.id.includes(q)
        );
      })
    : players;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className={`block text-xs font-semibold mb-1.5 ${accentClass}`}>
        {label}
      </label>

      {selected && !open ? (
        <button
          onClick={() => {
            setOpen(true);
            setQuery("");
          }}
          className="w-full text-left bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-3"
        >
          <MiniAvatar player={selected} />
          <div className="min-w-0">
            <span className="font-medium">{selected.nameZh}</span>
            <span className="text-slate-400 ml-2 text-sm">
              {selected.nameEn}
            </span>
          </div>
          {selected.position && (
            <span className="ml-auto text-slate-300 text-xs shrink-0">
              {selected.position}
            </span>
          )}
        </button>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="搜索球员名..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 placeholder-slate-300 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          autoFocus={open}
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl shadow-slate-200/50">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-slate-400 text-sm text-center">
              未找到球员
            </div>
          ) : (
            filtered.slice(0, 50).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-3 ${
                  selected?.id === p.id ? "bg-blue-50" : ""
                }`}
              >
                <MiniAvatar player={p} />
                <span className="text-slate-700 font-medium text-sm">
                  {p.nameZh}
                </span>
                <span className="text-slate-400 text-xs">{p.nameEn}</span>
                {p.position && (
                  <span className="ml-auto text-slate-300 text-xs">
                    {p.position}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
