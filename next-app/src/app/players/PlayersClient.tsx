"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllPlayers } from "@/lib/data";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";
import NBALogo from "@/components/NBALogo";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Player } from "@/lib/types";

type SortKey = "pts" | "reb" | "ast" | "gp" | "nameZh";
type SortDir = "asc" | "desc";

const POSITIONS = ["全部", "G", "F", "C", "G-F", "F-C", "F-G", "C-F"];
const STATUS_OPTIONS = ["全部", "现役", "退役"] as const;
const PAGE_SIZE = 48;

function positionLabel(pos?: string | null) {
  if (!pos) return "未知";
  const map: Record<string, string> = {
    G: "后卫",
    F: "前锋",
    C: "中锋",
    "G-F": "后卫-前锋",
    "F-C": "前锋-中锋",
    "F-G": "前锋-后卫",
    "C-F": "中锋-前锋",
  };
  return map[pos] || pos;
}

export default function PlayersClient() {
  const allPlayers = getAllPlayers();
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("全部");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("全部");
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = allPlayers;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameZh.includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.id.includes(q)
      );
    }

    // Position filter
    if (position !== "全部") {
      list = list.filter((p) => p.position === position);
    }

    // Status filter
    if (status === "现役") {
      list = list.filter((p) => p.active === true);
    } else if (status === "退役") {
      list = list.filter((p) => p.active === false);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let va: number | string;
      let vb: number | string;
      if (sortKey === "nameZh") {
        va = a.nameZh;
        vb = b.nameZh;
      } else {
        va = a.career[sortKey] ?? 0;
        vb = b.career[sortKey] ?? 0;
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [allPlayers, search, position, status, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => handleSort(key)}
      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
        sortKey === key
          ? "bg-red-600 text-white"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {label}
      {sortKey === key && (sortDir === "desc" ? " ↓" : " ↑")}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <SiteHeader
        logo={<NBALogo className="h-8 sm:h-10" />}
        rightSlot={<div className="text-xs text-slate-400">{allPlayers.length} 名球员</div>}
      />

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1">
          球员名录
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          浏览全部 {allPlayers.length} 名 NBA 球员，点击查看详细资料
        </p>

        {/* Search + Filters */}
        <div className="space-y-3 mb-6">
          {/* Search bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="搜索球员名字（中/英文）..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all"
            />
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Position */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 shrink-0">位置</span>
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  onClick={() => {
                    setPosition(pos);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    position === pos
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {pos === "全部" ? "全部" : pos}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />

            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 shrink-0">状态</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                  }}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    status === s
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block" />

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 shrink-0">排序</span>
              {sortBtn("pts", "得分")}
              {sortBtn("reb", "篮板")}
              {sortBtn("ast", "助攻")}
              {sortBtn("gp", "场次")}
              {sortBtn("nameZh", "名字")}
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="text-xs text-slate-400 mb-4">
          找到 {filtered.length} 名球员
          {totalPages > 1 && `（第 ${page}/${totalPages} 页）`}
        </div>

        {/* Player grid */}
        {paginated.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p className="text-lg mb-1">没有找到匹配的球员</p>
            <p className="text-sm">试试其他搜索词或筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {paginated.map((player) => (
              <PlayerGridCard key={player.id} player={player} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              上一页
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              下一页
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}

/** Single player card in the grid */
function PlayerGridCard({ player }: { player: Player }) {
  const headshotUrl = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);

  return (
    <Link
      href={`/player/${player.id}`}
      className="group block bg-white rounded-xl border border-slate-100 hover:border-red-200 hover:shadow-md transition-all p-3 sm:p-4"
    >
      {/* Avatar */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 rounded-full bg-slate-100 overflow-hidden">
        {headshotUrl ? (
          <Image
            src={headshotUrl}
            alt={player.nameEn}
            fill
            sizes="80px"
            className="object-cover object-top"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg sm:text-xl">
            {initials}
          </div>
        )}
        {/* Active badge */}
        {player.active && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
        )}
      </div>

      {/* Name */}
      <h3 className="text-sm font-bold text-slate-800 text-center truncate group-hover:text-red-600 transition-colors">
        {player.nameZh}
      </h3>
      <p className="text-[11px] text-slate-400 text-center truncate">
        {player.nameEn}
      </p>

      {/* Position + Key stat */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
        <span>{positionLabel(player.position)}</span>
        <span className="font-medium text-slate-600">
          {player.career.pts.toFixed(1)} 分
        </span>
      </div>
    </Link>
  );
}
