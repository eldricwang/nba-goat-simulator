import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAllPlayers, getPlayerById, getPlayerSeasons } from "@/lib/data";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";
import type { Player, PlayerSeason } from "@/lib/types";

/* ─── SSG: pre-render every player page at build time ─── */
export async function generateStaticParams() {
  return getAllPlayers().map((p) => ({ id: p.id }));
}

/* ─── Dynamic Metadata ─── */
interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) return { title: "球员未找到 | GOAT" };

  const title = `${player.nameZh} (${player.nameEn}) 生涯数据 | GOAT`;
  const desc = `${player.nameZh}（${player.nameEn}）的 NBA 生涯数据总览：场均 ${player.career.pts} 分 ${player.career.reb} 篮板 ${player.career.ast} 助攻，${player.career.mvp} 次 MVP，${player.career.fmvp} 次 FMVP。`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "profile",
    },
  };
}

/* ─── Helpers ─── */
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined) return "\u2014";
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(decimals);
}

function positionLabel(pos: string | null | undefined): string {
  if (!pos) return "\u2014";
  const map: Record<string, string> = {
    G: "后卫", F: "前锋", C: "中锋",
    "G-F": "后卫/前锋", "F-G": "前锋/后卫", "F-C": "前锋/中锋", "C-F": "中锋/前锋",
    PG: "控球后卫", SG: "得分后卫", SF: "小前锋", PF: "大前锋",
    Guard: "后卫", Forward: "前锋", Center: "中锋",
    "Guard-Forward": "后卫/前锋", "Forward-Guard": "前锋/后卫",
    "Forward-Center": "前锋/中锋", "Center-Forward": "中锋/前锋",
  };
  return map[pos] ?? pos;
}

function yearsLabel(from?: number | null, to?: number | null): string {
  if (from && to) return `${from}\u2013${to}`;
  if (from) return `${from}\u2013至今`;
  return "\u2014";
}

/* ─── JSON-LD structured data ─── */
function buildJsonLd(player: Player, baseUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${player.nameZh} (${player.nameEn}) 生涯数据`,
      description: `${player.nameZh} 的 NBA 生涯数据总览`,
      url: `${baseUrl}/player/${player.id}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "球员", item: `${baseUrl}/players` },
        { "@type": "ListItem", position: 3, name: player.nameZh, item: `${baseUrl}/player/${player.id}` },
      ],
    },
  ];
}

/* ─── Related players: same position, exclude self ─── */
function getRelatedPlayers(player: Player, allPlayers: Player[]): Player[] {
  if (!player.position) return allPlayers.filter((p) => p.id !== player.id).slice(0, 6);
  return allPlayers
    .filter((p) => p.id !== player.id && p.position === player.position)
    .sort((a, b) => (b.career.pts ?? 0) - (a.career.pts ?? 0))
    .slice(0, 6);
}

/* ─── Avatar component (server) ─── */
function PlayerAvatar({ player }: { player: Player }) {
  const url = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);
  if (!url) {
    return (
      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#C8102E] to-[#1D428A] flex items-center justify-center text-white text-3xl sm:text-4xl font-black ring-4 ring-white/80 shadow-lg">
        {initials}
      </div>
    );
  }
  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full ring-4 ring-white/80 shadow-lg overflow-hidden bg-slate-100">
      <Image
        src={url}
        alt={player.nameEn}
        fill
        className="object-cover object-top scale-125"
        sizes="144px"
        unoptimized
      />
    </div>
  );
}

/* ─── Stat cell for career summary ─── */
function StatBlock({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="text-center px-3 py-3 rounded-xl bg-white/80 shadow-sm border border-slate-100">
      <p className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-slate-800">
        {value}
        {unit && <span className="text-xs text-slate-400 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════ */
export default async function PlayerPage({ params }: PageProps) {
  const { id } = await params;
  const player = getPlayerById(id);
  if (!player) notFound();

  const seasons = getPlayerSeasons(player.id);
  const allPlayers = getAllPlayers();
  const related = getRelatedPlayers(player, allPlayers);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://goat.starcoby.com";
  const jsonLd = buildJsonLd(player, baseUrl);

  const c = player.career;

  return (
    <>
      {/* JSON-LD */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen">
        {/* ── Header ── */}
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-slate-800 hover:text-slate-600 transition-colors">
              GOAT
            </Link>
            <nav className="flex items-center gap-4 sm:gap-6 text-sm">
              <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors">首页</Link>
              <Link href="/compare" className="text-slate-500 hover:text-slate-800 transition-colors">对比</Link>
              <Link href="/about" className="text-slate-500 hover:text-slate-800 transition-colors">关于</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
          {/* ── Breadcrumb ── */}
          <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5">
            <Link href="/" className="hover:text-slate-600 transition-colors">首页</Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">{player.nameZh}</span>
          </nav>

          {/* ══════════════════════════════════
              Section 1: Player Info Card
              ══════════════════════════════════ */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden mb-8">
            {/* Accent top bar */}
            <div className="h-1.5 bg-gradient-to-r from-[#C8102E] to-[#1D428A]" />

            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar */}
                <PlayerAvatar player={player} />

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{player.nameZh}</h1>
                  <p className="text-slate-400 text-sm sm:text-base mt-1">{player.nameEn}</p>

                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap justify-center sm:justify-start">
                    {player.position && (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {positionLabel(player.position)}
                      </span>
                    )}
                    {player.active === true && (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-medium">
                        现役
                      </span>
                    )}
                    {player.active === false && (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                        退役
                      </span>
                    )}
                    {(player.fromYear || player.toYear) && (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                        {yearsLabel(player.fromYear, player.toYear)}
                      </span>
                    )}
                  </div>

                  {/* Extra info row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs text-slate-500">
                    {player.currentTeam && (
                      <div>
                        <span className="text-slate-400">球队: </span>
                        <span className="font-medium text-slate-700">{player.currentTeam}</span>
                      </div>
                    )}
                    {player.heightCm && (
                      <div>
                        <span className="text-slate-400">身高: </span>
                        <span className="font-medium text-slate-700">{player.heightCm} cm</span>
                      </div>
                    )}
                    {player.weightKg && (
                      <div>
                        <span className="text-slate-400">体重: </span>
                        <span className="font-medium text-slate-700">{player.weightKg} kg</span>
                      </div>
                    )}
                    {player.country && (
                      <div>
                        <span className="text-slate-400">国籍: </span>
                        <span className="font-medium text-slate-700">{player.country}</span>
                      </div>
                    )}
                    {player.draftYear && (
                      <div>
                        <span className="text-slate-400">选秀: </span>
                        <span className="font-medium text-slate-700">
                          {player.draftYear}年
                          {player.draftRound ? ` 第${player.draftRound}轮` : ""}
                          {player.draftPick ? ` 第${player.draftPick}顺位` : ""}
                        </span>
                      </div>
                    )}
                    {player.jerseyNumber && (
                      <div>
                        <span className="text-slate-400">号码: </span>
                        <span className="font-medium text-slate-700">#{player.jerseyNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="mt-5 flex flex-wrap gap-3 justify-center sm:justify-start">
                    <Link
                      href={`/compare?a=${player.id}`}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white shadow-md hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
                      style={{ background: "linear-gradient(135deg, #C8102E, #1D428A)" }}
                    >
                      对比该球员
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              Section 2: Career Stats Summary
              ══════════════════════════════════ */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">生涯数据总览</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
              <StatBlock label="场次" value={fmt(c.gp, 0)} />
              <StatBlock label="分钟" value={fmt(c.mp)} />
              <StatBlock label="得分" value={fmt(c.pts)} />
              <StatBlock label="篮板" value={fmt(c.reb)} />
              <StatBlock label="助攻" value={fmt(c.ast)} />
              <StatBlock label="FG%" value={fmt(c.fgPct)} unit="%" />
              <StatBlock label="3P%" value={fmt(c.tpPct)} unit="%" />
              <StatBlock label="TS%" value={fmt(c.tsPct)} unit="%" />
              <StatBlock label="MVP" value={fmt(c.mvp, 0)} />
              <StatBlock label="FMVP" value={fmt(c.fmvp, 0)} />
            </div>
          </div>

          {/* ══════════════════════════════════
              Section 3: Season-by-Season Table
              ══════════════════════════════════ */}
          {seasons.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                赛季数据 <span className="text-sm font-normal text-slate-400">({seasons.length} 个赛季)</span>
              </h2>
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <th className="text-left px-4 py-3 font-semibold whitespace-nowrap sticky left-0 bg-slate-50 z-10">赛季</th>
                        {seasons[0]?.team !== undefined && (
                          <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">球队</th>
                        )}
                        <th className="text-center px-3 py-3 font-semibold">GP</th>
                        <th className="text-center px-3 py-3 font-semibold">MIN</th>
                        <th className="text-center px-3 py-3 font-semibold">PTS</th>
                        <th className="text-center px-3 py-3 font-semibold">REB</th>
                        <th className="text-center px-3 py-3 font-semibold">AST</th>
                        <th className="text-center px-3 py-3 font-semibold">FG%</th>
                        <th className="text-center px-3 py-3 font-semibold">3P%</th>
                        <th className="text-center px-3 py-3 font-semibold">TS%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seasons.map((s, i) => (
                        <tr
                          key={s.season}
                          className={`border-b border-slate-50 hover:bg-blue-50/40 transition-colors ${
                            i % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <td className="px-4 py-2.5 font-medium whitespace-nowrap sticky left-0 z-10" style={{ background: "inherit" }}>
                            <Link
                              href={`/player/${player.id}/season/${s.season}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {s.season}
                            </Link>
                          </td>
                          {seasons[0]?.team !== undefined && (
                            <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{s.team || "\u2014"}</td>
                          )}
                          <SeasonCell val={s.gp} avg={c.gp / (seasons.length || 1)} isInt />
                          <SeasonCell val={s.mp} avg={c.mp} />
                          <SeasonCell val={s.pts} avg={c.pts} />
                          <SeasonCell val={s.reb} avg={c.reb} />
                          <SeasonCell val={s.ast} avg={c.ast} />
                          <SeasonCell val={s.fgPct} avg={c.fgPct} isPct />
                          <SeasonCell val={s.tpPct} avg={c.tpPct} isPct />
                          <SeasonCell val={s.tsPct} avg={c.tsPct} isPct />
                        </tr>
                      ))}
                    </tbody>
                    {/* Career average footer */}
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-200 font-semibold text-slate-700">
                        <td className="px-4 py-2.5 sticky left-0 bg-slate-100 z-10">生涯</td>
                        {seasons[0]?.team !== undefined && <td className="px-3 py-2.5">\u2014</td>}
                        <td className="text-center px-3 py-2.5">{fmt(c.gp, 0)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.mp)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.pts)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.reb)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.ast)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.fgPct)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.tpPct)}</td>
                        <td className="text-center px-3 py-2.5">{fmt(c.tsPct)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {seasons.length === 0 && (
            <div className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-400">
              暂无赛季详细数据
            </div>
          )}

          {/* ══════════════════════════════════
              Section 4: Related Players
              ══════════════════════════════════ */}
          {related.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                相关球员
                {player.position && (
                  <span className="text-sm font-normal text-slate-400 ml-2">同位置</span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {related.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/player/${rp.id}`}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center hover:shadow-md hover:border-slate-300 transition-all"
                  >
                    <div className="relative w-14 h-14 mx-auto rounded-full overflow-hidden bg-slate-100 mb-2 ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all">
                      {getHeadshotUrl(rp.nbaId) ? (
                        <Image
                          src={getHeadshotUrl(rp.nbaId)!}
                          alt={rp.nameEn}
                          fill
                          className="object-cover object-top scale-125"
                          sizes="56px"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">
                          {getPlayerInitials(rp.nameEn)}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-700 truncate">{rp.nameZh}</p>
                    <p className="text-[10px] text-slate-400 truncate">{rp.nameEn}</p>
                    <p className="text-xs text-slate-500 mt-1">{fmt(rp.career.pts)} PPG</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-slate-200 mt-auto py-4 bg-white/40">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between text-[11px] text-slate-400">
            <p>GOAT — Greatest Of All Time Comparator</p>
            <div className="flex gap-4">
              <Link href="/compare" className="hover:text-slate-600 transition-colors">对比</Link>
              <Link href="/about" className="hover:text-slate-600 transition-colors">关于</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

/* ─── Season table cell with color-coding vs career avg ─── */
function SeasonCell({
  val,
  avg,
  isInt,
  isPct,
}: {
  val: number | null | undefined;
  avg: number | null | undefined;
  isInt?: boolean;
  isPct?: boolean;
}) {
  if (val === null || val === undefined) {
    return <td className="text-center px-3 py-2.5 text-slate-300">{"\u2014"}</td>;
  }

  const display = isPct ? val.toFixed(1) : isInt ? Math.round(val).toString() : val.toFixed(1);

  // Color-code: green if above career avg, red if below
  let colorClass = "text-slate-700";
  if (avg !== null && avg !== undefined) {
    if (val > avg * 1.05) colorClass = "text-emerald-600";
    else if (val < avg * 0.95) colorClass = "text-orange-500";
  }

  return <td className={`text-center px-3 py-2.5 ${colorClass}`}>{display}</td>;
}
