// src/components/PlayerDatabase.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { searchPlayers } from "../api";
import type { PlayerData, PlayerSearchParams, PlayerSearchResult } from "../api";

interface PlayerDatabaseProps {
  onBack: () => void;
}

// 位置选项
const POSITIONS = [
  { value: "", label: "全部位置" },
  { value: "PG", label: "PG 控球后卫" },
  { value: "SG", label: "SG 得分后卫" },
  { value: "SF", label: "SF 小前锋" },
  { value: "PF", label: "PF 大前锋" },
  { value: "C", label: "C 中锋" },
  { value: "G", label: "G 后卫" },
  { value: "F", label: "F 前锋" },
];

// 排序选项
const SORT_OPTIONS = [
  { value: "ppg", label: "场均得分" },
  { value: "rpg", label: "场均篮板" },
  { value: "apg", label: "场均助攻" },
  { value: "totalPoints", label: "生涯总分" },
  { value: "gamesPlayed", label: "出场数" },
  { value: "championships", label: "总冠军" },
  { value: "mvp", label: "MVP" },
  { value: "allStar", label: "全明星" },
  { value: "peakPPG", label: "巅峰得分" },
  { value: "name", label: "姓名" },
];

export default function PlayerDatabase({ onBack }: PlayerDatabaseProps) {
  const [searchResult, setSearchResult] = useState<PlayerSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);

  // 搜索参数
  const [keyword, setKeyword] = useState("");
  const [position, setPosition] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [hasStatsOnly, setHasStatsOnly] = useState(false);
  const [sortBy, setSortBy] = useState("ppg");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 执行搜索
  const doSearch = useCallback(
    async (params: PlayerSearchParams) => {
      setLoading(true);
      try {
        const result = await searchPlayers(params);
        setSearchResult(result);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 当搜索参数变化时触发搜索
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      doSearch({
        keyword,
        position,
        activeOnly,
        hasStatsOnly,
        sortBy,
        sortDesc,
        page,
        pageSize,
      });
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [keyword, position, activeOnly, hasStatsOnly, sortBy, sortDesc, page, doSearch]);

  // 关键词变化时重置到第一页
  const handleKeywordChange = (val: string) => {
    setKeyword(val);
    setPage(1);
  };

  const handleFilterChange = () => {
    setPage(1);
  };

  // 球员详情弹窗
  const PlayerDetailModal = ({ player }: { player: PlayerData }) => (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setSelectedPlayer(null)}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-gray-700 p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{player.avatar}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{player.name}</h2>
              <p className="text-sm text-gray-400">
                {player.nameEn}
                {player.isActive && (
                  <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    现役
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {player.position && `${player.position} | `}
                {player.era}
                {player.teams.length > 0 && ` | ${player.teams.join(" → ")}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPlayer(null)}
            className="text-gray-500 hover:text-white text-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {player.hasDetailedStats ? (
          <>
            {/* 核心荣誉 */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: "总冠军", value: player.championships, emoji: "🏆" },
                { label: "MVP", value: player.mvp, emoji: "🏅" },
                { label: "FMVP", value: player.fmvp, emoji: "🏅" },
                { label: "全明星", value: player.allStar, emoji: "⭐" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div className="text-lg">{item.emoji}</div>
                  <div className="text-xl font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>

            {/* 常规赛数据 */}
            <h3 className="text-sm font-bold text-gray-400 mb-2">常规赛数据</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "场均得分", value: player.ppg },
                { label: "场均篮板", value: player.rpg },
                { label: "场均助攻", value: player.apg },
                { label: "场均抢断", value: player.spg },
                { label: "场均盖帽", value: player.bpg },
                { label: "命中率%", value: player.fgPct },
                { label: "出场数", value: player.gamesPlayed },
                { label: "生涯总分", value: player.totalPoints.toLocaleString() },
                { label: "巅峰得分", value: player.peakPPG },
              ].map((item) => (
                <div key={item.label} className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-white">{item.value}</div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                </div>
              ))}
            </div>

            {/* 季后赛数据 */}
            {(player.playoffPPG > 0 || player.playoffWins > 0) && (
              <>
                <h3 className="text-sm font-bold text-gray-400 mb-2">季后赛数据</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{player.playoffPPG}</div>
                    <div className="text-xs text-gray-500">场均得分</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">{player.playoffRPG}</div>
                    <div className="text-xs text-gray-500">场均篮板</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-white">
                      {player.playoffWins}W-{player.playoffLosses}L
                    </div>
                    <div className="text-xs text-gray-500">胜-负</div>
                  </div>
                </div>
              </>
            )}

            {/* 更多荣誉 */}
            <h3 className="text-sm font-bold text-gray-400 mb-2">更多荣誉</h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              {[
                { label: "最佳阵容一阵", value: player.allNBA1st },
                { label: "最佳阵容二阵", value: player.allNBA2nd },
                { label: "最佳阵容三阵", value: player.allNBA3rd },
                { label: "最佳防守阵容", value: player.allDefense },
                { label: "最佳防守球员", value: player.dpoy },
                { label: "得分王", value: player.scoringTitle },
                { label: "助攻王", value: player.assistTitle },
                { label: "篮板王", value: player.reboundTitle },
                { label: "全明星MVP", value: player.allStarMVP },
                { label: "最佳新秀", value: player.roy },
              ]
                .filter((item) => item.value > 0)
                .map((item) => (
                  <div key={item.label} className="flex justify-between py-1 px-2 bg-gray-800/30 rounded">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </div>
                ))}
            </div>

            {player.peakSeason && (
              <div className="mt-3 text-center text-xs text-gray-500">
                巅峰赛季: {player.peakSeason} ({player.peakPPG} PPG)
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-3">📊</div>
            <p className="font-bold">暂无详细数据</p>
            <p className="text-sm mt-1">该球员的详细统计数据将在下次数据更新时获取</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← 返回
              </button>
              <span className="text-3xl">🏀</span>
              <div>
                <h1 className="text-xl font-black tracking-tight">NBA 球员数据库</h1>
                <p className="text-xs text-gray-500">
                  搜索和浏览所有 NBA 历史球员
                  {searchResult && ` — 共 ${searchResult.total} 名球员`}
                </p>
              </div>
            </div>
            {loading && (
              <span className="text-xs text-orange-400 animate-pulse">搜索中...</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索球员（中文/英文名）..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 pl-10
                text-white placeholder-gray-500 focus:outline-none focus:border-orange-500
                transition-colors text-base"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              🔍
            </span>
            {keyword && (
              <button
                onClick={() => handleKeywordChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* 位置筛选 */}
          <select
            value={position}
            onChange={(e) => {
              setPosition(e.target.value);
              handleFilterChange();
            }}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* 排序 */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-orange-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                按{s.label}排序
              </option>
            ))}
          </select>

          {/* 排序方向 */}
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white
              hover:border-gray-600 transition-colors"
          >
            {sortDesc ? "↓ 降序" : "↑ 升序"}
          </button>

          {/* 现役筛选 */}
          <button
            onClick={() => {
              setActiveOnly(!activeOnly);
              handleFilterChange();
            }}
            className={`border rounded-lg px-3 py-2 text-sm transition-colors
              ${activeOnly
                ? "bg-green-500/20 border-green-500 text-green-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
          >
            🟢 仅现役
          </button>

          {/* 有数据筛选 */}
          <button
            onClick={() => {
              setHasStatsOnly(!hasStatsOnly);
              handleFilterChange();
            }}
            className={`border rounded-lg px-3 py-2 text-sm transition-colors
              ${hasStatsOnly
                ? "bg-blue-500/20 border-blue-500 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"
              }`}
          >
            📊 有数据
          </button>
        </div>

        {/* 球员列表 */}
        <div className="space-y-2">
          {searchResult?.players.map((player) => (
            <div
              key={`${player.nbaId}-${player.id}`}
              onClick={() => setSelectedPlayer(player)}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer
                bg-gray-800/50 border border-transparent hover:bg-gray-800 hover:border-gray-600
                transition-all duration-200"
            >
              {/* 头像 */}
              <div className="text-2xl shrink-0 w-10 text-center">{player.avatar}</div>

              {/* 球员信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white truncate">{player.name}</span>
                  {player.name !== player.nameEn && (
                    <span className="text-xs text-gray-500 truncate hidden sm:inline">
                      {player.nameEn}
                    </span>
                  )}
                  {player.isActive && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full shrink-0">
                      现役
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {player.position && `${player.position} | `}
                  {player.era}
                  {player.teams.length > 0 && ` | ${player.teams[0]}`}
                  {player.championships > 0 && ` | ${player.championships}冠`}
                </div>
              </div>

              {/* 核心数据 */}
              {player.hasDetailedStats ? (
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-lg font-bold font-mono text-orange-400">
                      {player.ppg}
                    </div>
                    <div className="text-xs text-gray-500">PPG</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-mono text-gray-300">{player.rpg}</div>
                    <div className="text-xs text-gray-500">RPG</div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-mono text-gray-300">{player.apg}</div>
                    <div className="text-xs text-gray-500">APG</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-sm font-mono text-gray-300">
                      {player.gamesPlayed}
                    </div>
                    <div className="text-xs text-gray-500">场次</div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-600 shrink-0">暂无数据</div>
              )}
            </div>
          ))}
        </div>

        {/* 空状态 */}
        {searchResult && searchResult.players.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400 font-bold">未找到匹配的球员</p>
            <p className="text-gray-500 text-sm mt-1">
              试试其他搜索关键词或筛选条件
            </p>
          </div>
        )}

        {/* 分页 */}
        {searchResult && searchResult.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 
                hover:text-white hover:bg-gray-700 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← 上一页
            </button>

            <div className="flex items-center gap-1">
              {/* 生成页码按钮 */}
              {(() => {
                const pages: number[] = [];
                const total = searchResult.totalPages;
                const current = searchResult.page;

                // 始终显示第一页
                pages.push(1);
                // 当前页附近
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                  pages.push(i);
                }
                // 始终显示最后一页
                if (total > 1) pages.push(total);

                // 去重并排序
                const unique = [...new Set(pages)].sort((a, b) => a - b);

                const elements: JSX.Element[] = [];
                let prev = 0;
                for (const p of unique) {
                  if (prev > 0 && p - prev > 1) {
                    elements.push(
                      <span key={`ellipsis-${p}`} className="text-gray-600 px-1">
                        ...
                      </span>
                    );
                  }
                  elements.push(
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors
                        ${p === current
                          ? "bg-orange-500 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                        }`}
                    >
                      {p}
                    </button>
                  );
                  prev = p;
                }
                return elements;
              })()}
            </div>

            <button
              disabled={page >= searchResult.totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 rounded-lg text-sm bg-gray-800 text-gray-400 
                hover:text-white hover:bg-gray-700 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页 →
            </button>

            <span className="text-xs text-gray-500 ml-2">
              第 {searchResult.page}/{searchResult.totalPages} 页，共 {searchResult.total} 名球员
            </span>
          </div>
        )}
      </main>

      {/* 球员详情弹窗 */}
      {selectedPlayer && <PlayerDetailModal player={selectedPlayer} />}
    </div>
  );
}
