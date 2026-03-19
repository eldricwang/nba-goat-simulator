// src/App.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { fetchRankings, fetchPresets } from "./api";
import type { WeightConfig, WeightPreset, RankedPlayer } from "./api";
import WeightSlider from "./components/WeightSlider";
import PresetSelector from "./components/PresetSelector";
import RankingList from "./components/RankingList";
import PlayerCard from "./components/PlayerCard";
import PlayerCompare from "./components/PlayerCompare";
import CommentSection from "./components/CommentSection";
import AuthModal from "./components/AuthModal";
import ProfilePage from "./components/ProfilePage";
import PlayerDatabase from "./components/PlayerDatabase";
import { useAuth } from "./contexts/AuthContext";

const DEFAULT_WEIGHTS: WeightConfig = {
  championships: 70, mvp: 65, fmvp: 60, allStar: 25, allNBA: 35,
  allDefense: 20, dpoy: 30, scoringTitle: 25, ppg: 40, rpg: 20,
  apg: 20, totalPoints: 30, playoffPPG: 45, playoffWins: 35, peakPPG: 35,
};

type ViewMode = "ranking" | "compare";
type PageMode = "home" | "profile" | "database";

export default function App() {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageMode>("home");
  const [weights, setWeights] = useState<WeightConfig>({ ...DEFAULT_WEIGHTS });
  const [activePreset, setActivePreset] = useState<string | null>("均衡模式");
  const [selectedPlayer, setSelectedPlayer] = useState<RankedPlayer | null>(null);
  const [comparePlayer1, setComparePlayer1] = useState<number | null>(null);
  const [comparePlayer2, setComparePlayer2] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("ranking");
  const [showWeights, setShowWeights] = useState(true);

  // 后端数据状态
  const [rankings, setRankings] = useState<RankedPlayer[]>([]);
  const [presets, setPresets] = useState<WeightPreset[]>([]);
  const [loading, setLoading] = useState(false);

  // 防抖定时器
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载预设方案（一次性）
  useEffect(() => {
    fetchPresets().then(setPresets).catch(console.error);
  }, []);

  // 权重变化时，防抖调用后端计算排名
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetchRankings(weights)
        .then(setRankings)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 150); // 150ms 防抖

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [weights]);

  const handleWeightChange = useCallback(
    (key: keyof WeightConfig, value: number) => {
      setWeights((prev) => ({ ...prev, [key]: value }));
      setActivePreset(null);
    },
    []
  );

  const handlePresetSelect = useCallback((preset: WeightPreset) => {
    setWeights({ ...preset.weights });
    setActivePreset(preset.name);
  }, []);

  const handleReset = useCallback(() => {
    setWeights({ ...DEFAULT_WEIGHTS });
    setActivePreset("均衡模式");
  }, []);

  const handleSelectPlayer = useCallback((ranked: RankedPlayer) => {
    setSelectedPlayer(ranked);
  }, []);

  const handleCompareSelect = useCallback(
    (playerId: number) => {
      if (comparePlayer1 === null) {
        setComparePlayer1(playerId);
      } else if (comparePlayer2 === null) {
        if (playerId !== comparePlayer1) {
          setComparePlayer2(playerId);
        }
      } else {
        setComparePlayer1(playerId);
        setComparePlayer2(null);
      }
    },
    [comparePlayer1, comparePlayer2]
  );

  const compareData = useMemo(() => {
    if (comparePlayer1 === null || comparePlayer2 === null) return null;
    const r1 = rankings.find((r) => r.player.id === comparePlayer1);
    const r2 = rankings.find((r) => r.player.id === comparePlayer2);
    if (!r1 || !r2) return null;
    const rank1 = rankings.indexOf(r1) + 1;
    const rank2 = rankings.indexOf(r2) + 1;
    return { player1: r1, player2: r2, rank1, rank2 };
  }, [rankings, comparePlayer1, comparePlayer2]);

  const selectedRank = useMemo(() => {
    if (!selectedPlayer) return 0;
    return rankings.findIndex((r) => r.player.id === selectedPlayer.player.id) + 1;
  }, [rankings, selectedPlayer]);

  const topPlayerName = rankings.length > 0 ? rankings[0].player.name : undefined;

  // 个人主页
  if (currentPage === "profile") {
    return <ProfilePage onBack={() => setCurrentPage("home")} />;
  }

  // 球员数据库
  if (currentPage === "database") {
    return <PlayerDatabase onBack={() => setCurrentPage("home")} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏀</span>
              <div>
                <h1 className="text-xl font-black tracking-tight">
                  NBA历史地位模拟器
                </h1>
                <p className="text-xs text-gray-500">
                  GOAT Simulator — 用你的标准定义历史排名
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {loading && (
                <span className="text-xs text-orange-400 animate-pulse mr-2">计算中...</span>
              )}
              <button
                onClick={() => setViewMode("ranking")}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${viewMode === "ranking"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
              >
                📊 排名
              </button>
              <button
                onClick={() => {
                  setViewMode("compare");
                  setComparePlayer1(null);
                  setComparePlayer2(null);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
                  ${viewMode === "compare"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
              >
                🆚 对比
              </button>
              <button
                onClick={() => setCurrentPage("database")}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all
                  bg-gray-800 text-gray-400 hover:text-white"
              >
                🔍 球员库
              </button>

              {/* 用户登录区域 */}
              <div className="ml-2 pl-2 border-l border-gray-700">
                {user ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage("profile")}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      title="个人主页"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden"
                        style={{
                          background: user.avatar_url
                            ? 'transparent'
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        }}
                      >
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.nickname}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          user.nickname[0]
                        )}
                      </div>
                      <span className="text-sm text-gray-300 hidden sm:inline">
                        {user.nickname}
                      </span>
                    </button>
                    <button
                      onClick={logout}
                      className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      退出
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition-opacity"
                  >
                    登录
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 预设模板 */}
        <section className="mb-6">
          <h2 className="text-sm font-bold text-gray-400 mb-3">
            ⚡ 快速预设 — 选择一个评价标准
          </h2>
          <PresetSelector
            presets={presets}
            onSelect={handlePresetSelect}
            activePreset={activePreset}
          />
        </section>

        {/* 权重调节区域 */}
        <section className="mb-6">
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3 hover:text-white transition-colors"
          >
            🎛️ 自定义权重调节
            <span className="text-xs">{showWeights ? "▼ 收起" : "▶ 展开"}</span>
          </button>

          {showWeights && (
            <div className="bg-gray-900/50 rounded-2xl p-5 border border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs text-gray-500">
                  拖动滑块调整各维度权重（0-100），实时查看排名变化
                </p>
                <button
                  onClick={handleReset}
                  className="text-xs text-orange-400 hover:text-orange-300 px-3 py-1 rounded-lg border border-orange-400/30 hover:border-orange-400"
                >
                  🔄 恢复默认
                </button>
              </div>
              <WeightSlider weights={weights} onChange={handleWeightChange} />
            </div>
          )}
        </section>

        {/* 主内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-400">
                {viewMode === "ranking"
                  ? `📊 历史排名 — 共 ${rankings.length} 位球员`
                  : "🆚 选择两位球员进行对比"}
              </h2>
              {viewMode === "compare" && (
                <div className="text-xs text-gray-500">
                  {comparePlayer1 === null
                    ? "👈 请选择第一位球员"
                    : comparePlayer2 === null
                    ? "👈 请选择第二位球员"
                    : "点击球员可重新选择"}
                </div>
              )}
            </div>

            {viewMode === "ranking" ? (
              <RankingList
                rankings={rankings}
                onSelectPlayer={handleSelectPlayer}
                selectedPlayerId={selectedPlayer?.player.id ?? null}
              />
            ) : (
              <div className="space-y-2">
                {rankings.map((ranked, index) => {
                  const isSelected1 = ranked.player.id === comparePlayer1;
                  const isSelected2 = ranked.player.id === comparePlayer2;

                  return (
                    <div
                      key={ranked.player.id}
                      onClick={() => handleCompareSelect(ranked.player.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer
                        transition-all duration-200 border
                        ${isSelected1
                          ? "bg-green-500/20 border-green-500"
                          : isSelected2
                          ? "bg-blue-500/20 border-blue-500"
                          : "bg-gray-800/50 border-transparent hover:bg-gray-800 hover:border-gray-600"
                        }`}
                    >
                      <div className="w-8 text-center shrink-0">
                        {isSelected1 ? (
                          <span className="text-green-400 font-bold text-sm">P1</span>
                        ) : isSelected2 ? (
                          <span className="text-blue-400 font-bold text-sm">P2</span>
                        ) : (
                          <span className="text-gray-600 text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="text-2xl">{ranked.player.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">
                          {ranked.player.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ranked.player.position} | {ranked.player.era}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold font-mono text-orange-400">
                          {ranked.score.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-20">
              {viewMode === "ranking" ? (
                selectedPlayer ? (
                  <PlayerCard
                    ranked={
                      rankings.find(
                        (r) => r.player.id === selectedPlayer.player.id
                      ) || selectedPlayer
                    }
                    rank={selectedRank}
                  />
                ) : (
                  <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 text-center">
                    <div className="text-5xl mb-4">👈</div>
                    <p className="text-gray-400 font-bold">点击左侧球员</p>
                    <p className="text-gray-500 text-sm mt-1">
                      查看详细数据和各维度得分
                    </p>
                  </div>
                )
              ) : compareData ? (
                <PlayerCompare
                  player1={compareData.player1}
                  player2={compareData.player2}
                  rank1={compareData.rank1}
                  rank2={compareData.rank2}
                />
              ) : (
                <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 text-center">
                  <div className="text-5xl mb-4">🆚</div>
                  <p className="text-gray-400 font-bold">选择两位球员</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {comparePlayer1 !== null
                      ? "再选一位球员开始对比"
                      : "从左侧列表中选择两位球员进行对比"}
                  </p>
                  {comparePlayer1 !== null && (
                    <div className="mt-4 text-sm text-green-400">
                      ✓ 已选择第一位球员
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 评论区 */}
        <section className="mt-12 border-t border-gray-800 pt-8">
          <CommentSection teamName={topPlayerName} />
        </section>
      </main>

      {/* 底部 */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            🏀 NBA历史地位模拟器 GOAT Simulator
          </p>
          <p className="text-xs text-gray-700 mt-1">
            数据仅供娱乐参考 | 每个人心中都有自己的GOAT
          </p>
        </div>
      </footer>

      {/* 登录/注册弹窗 */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
