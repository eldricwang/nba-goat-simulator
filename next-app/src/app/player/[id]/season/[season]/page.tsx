import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getAllPlayers,
  getPlayerById,
  getPlayerSeasons,
  getPlayerSeason,
} from "@/lib/data";
import { getHeadshotUrl, getPlayerInitials } from "@/lib/avatar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import type { Player, PlayerSeason } from "@/lib/types";

/* ─── SSG: pre-render every player+season page at build time ─── */
export async function generateStaticParams() {
  const allPlayers = getAllPlayers();
  const params: { id: string; season: string }[] = [];
  for (const p of allPlayers) {
    const seasons = getPlayerSeasons(p.id);
    for (const s of seasons) {
      params.push({ id: p.id, season: s.season });
    }
  }
  return params;
}

/* ─── Dynamic Metadata ─── */
interface PageProps {
  params: Promise<{ id: string; season: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, season } = await params;
  const player = getPlayerById(id);
  if (!player) return { title: "球员未找到 | GOAT" };

  const seasonData = getPlayerSeason(id, season);
  if (!seasonData) return { title: `${player.nameZh} - 赛季未找到 | GOAT` };

  const title = `${player.nameZh} (${player.nameEn}) ${season} 赛季数据 | GOAT`;
  const desc = `${player.nameZh}（${player.nameEn}）${season} 赛季数据：${seasonData.gp} 场，场均 ${seasonData.pts} 分 ${seasonData.reb} 篮板 ${seasonData.ast} 助攻，投篮命中率 ${seasonData.fgPct}%。`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "article",
    },
  };
}

/* ─── Helpers ─── */
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined) return "\u2014";
  if (Number.isInteger(val) && decimals === 0) return val.toString();
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

/* ─── JSON-LD structured data ─── */
function buildJsonLd(player: Player, season: string, baseUrl: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${player.nameZh} (${player.nameEn}) ${season} 赛季数据`,
      description: `${player.nameZh} 的 ${season} 赛季 NBA 数据`,
      url: `${baseUrl}/player/${player.id}/season/${season}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "首页", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "球员", item: `${baseUrl}/players` },
        { "@type": "ListItem", position: 3, name: player.nameZh, item: `${baseUrl}/player/${player.id}` },
        { "@type": "ListItem", position: 4, name: `${season} 赛季`, item: `${baseUrl}/player/${player.id}/season/${season}` },
      ],
    },
  ];
}

/* ─── Avatar component (server) ─── */
function PlayerAvatar({ player }: { player: Player }) {
  const url = getHeadshotUrl(player.nbaId);
  const initials = getPlayerInitials(player.nameEn);
  if (!url) {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#C8102E] to-[#1D428A] flex items-center justify-center text-white text-2xl sm:text-3xl font-black ring-4 ring-white/80 shadow-lg">
        {initials}
      </div>
    );
  }
  return (
    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full ring-4 ring-white/80 shadow-lg overflow-hidden bg-slate-100">
      <Image
        src={url}
        alt={player.nameEn}
        fill
        className="object-cover object-top scale-125"
        sizes="96px"
        unoptimized
      />
    </div>
  );
}

/* ─── Comparison stat row ─── */
function CompareRow({
  label,
  seasonVal,
  careerVal,
  isPct,
  isInt,
  higherIsBetter = true,
}: {
  label: string;
  seasonVal: number | null | undefined;
  careerVal: number | null | undefined;
  isPct?: boolean;
  isInt?: boolean;
  higherIsBetter?: boolean;
}) {
  const sDisplay = seasonVal !== null && seasonVal !== undefined
    ? isPct ? seasonVal.toFixed(1) + "%" : isInt ? Math.round(seasonVal).toString() : seasonVal.toFixed(1)
    : "\u2014";
  const cDisplay = careerVal !== null && careerVal !== undefined
    ? isPct ? careerVal.toFixed(1) + "%" : isInt ? Math.round(careerVal).toString() : careerVal.toFixed(1)
    : "\u2014";

  // Compute diff and color
  let diffText = "";
  let diffColor = "text-slate-400";
  let seasonColor = "text-slate-800";

  if (
    seasonVal !== null && seasonVal !== undefined &&
    careerVal !== null && careerVal !== undefined
  ) {
    const diff = seasonVal - careerVal;
    if (Math.abs(diff) > 0.05) {
      const sign = diff > 0 ? "+" : "";
      diffText = isPct
        ? `${sign}${diff.toFixed(1)}%`
        : isInt
          ? `${sign}${Math.round(diff)}`
          : `${sign}${diff.toFixed(1)}`;

      const isGood = higherIsBetter ? diff > 0 : diff < 0;
      const isBad = higherIsBetter ? diff < 0 : diff > 0;

      if (Math.abs(diff) / (Math.abs(careerVal) || 1) > 0.05) {
        if (isGood) {
          diffColor = "text-emerald-600";
          seasonColor = "text-emerald-700";
        } else if (isBad) {
          diffColor = "text-orange-500";
          seasonColor = "text-orange-600";
        }
      }
    }
  }

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-slate-600">{label}</td>
      <td className={`px-4 py-3 text-sm font-bold text-center ${seasonColor}`}>{sDisplay}</td>
      <td className="px-4 py-3 text-sm text-center text-slate-500">{cDisplay}</td>
      <td className={`px-4 py-3 text-sm text-center font-medium ${diffColor}`}>{diffText || "\u2014"}</td>
    </tr>
  );
}

/* ════════════════════════════════════════════
   Page Component
   ════════════════════════════════════════════ */
export default async function SeasonPage({ params }: PageProps) {
  const { id, season } = await params;
  const player = getPlayerById(id);
  if (!player) notFound();

  const seasonData = getPlayerSeason(id, season);
  if (!seasonData) notFound();

  const allSeasons = getPlayerSeasons(id);
  const currentIdx = allSeasons.findIndex((s) => s.season === season);
  const prevSeason = currentIdx > 0 ? allSeasons[currentIdx - 1] : null;
  const nextSeason = currentIdx < allSeasons.length - 1 ? allSeasons[currentIdx + 1] : null;

  const c = player.career;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://goat.starcoby.com";
  const jsonLd = buildJsonLd(player, season, baseUrl);

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
        <SiteHeader />

        <main className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
          {/* ── Breadcrumb ── */}
          <nav className="text-xs text-slate-400 mb-6 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-slate-600 transition-colors">首页</Link>
            <span>/</span>
            <Link href="/players" className="hover:text-slate-600 transition-colors">球员</Link>
            <span>/</span>
            <Link href={`/player/${player.id}`} className="hover:text-slate-600 transition-colors">
              {player.nameZh}
            </Link>
            <span>/</span>
            <span className="text-slate-600 font-medium">{season} 赛季</span>
          </nav>

          {/* ══════════════════════════════════
              Section 1: Player + Season Header
              ══════════════════════════════════ */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden mb-8">
            <div className="h-1.5 bg-gradient-to-r from-[#C8102E] to-[#1D428A]" />

            <div className="p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <PlayerAvatar player={player} />

                <div className="flex-1 text-center sm:text-left">
                  <Link
                    href={`/player/${player.id}`}
                    className="hover:underline transition-colors"
                  >
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {player.nameZh}
                      <span className="text-slate-400 text-sm sm:text-base ml-2 font-normal">
                        {player.nameEn}
                      </span>
                    </h1>
                  </Link>

                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                    <span className="text-sm px-4 py-1.5 rounded-full bg-gradient-to-r from-red-50 to-blue-50 text-slate-700 border border-slate-200 font-bold">
                      {season} 赛季
                    </span>
                    {player.position && (
                      <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                        {positionLabel(player.position)}
                      </span>
                    )}
                    {seasonData.team && (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                        {seasonData.team}
                      </span>
                    )}
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mt-3 flex-wrap justify-center sm:justify-start text-sm">
                    <span className="font-bold text-slate-800">{fmt(seasonData.pts)} <span className="text-xs text-slate-400 font-normal">PPG</span></span>
                    <span className="font-bold text-slate-800">{fmt(seasonData.reb)} <span className="text-xs text-slate-400 font-normal">RPG</span></span>
                    <span className="font-bold text-slate-800">{fmt(seasonData.ast)} <span className="text-xs text-slate-400 font-normal">APG</span></span>
                    <span className="text-slate-500">{fmt(seasonData.gp, 0)} <span className="text-xs text-slate-400">场</span></span>
                  </div>

                  {/* CTAs */}
                  <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                    <Link
                      href={`/compare?a=${player.id}&mode=season&sa=${season}`}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md hover:scale-105 hover:shadow-lg active:scale-95 transition-all"
                      style={{ background: "linear-gradient(135deg, #C8102E, #1D428A)" }}
                    >
                      用此赛季对比
                    </Link>
                    <Link
                      href={`/player/${player.id}`}
                      className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      返回球员主页
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              Section 2: Season vs Career Comparison
              ══════════════════════════════════ */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              赛季数据 vs 生涯平均
              <span className="text-xs font-normal text-slate-400 ml-2">
                高于生涯平均 = <span className="text-emerald-600 font-medium">绿色</span>，
                低于生涯平均 = <span className="text-orange-500 font-medium">橙色</span>
              </span>
            </h2>

            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3 font-semibold">指标</th>
                      <th className="text-center px-4 py-3 font-semibold">{season}</th>
                      <th className="text-center px-4 py-3 font-semibold">生涯平均</th>
                      <th className="text-center px-4 py-3 font-semibold">差值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow label="出场" seasonVal={seasonData.gp} careerVal={c.gp / (allSeasons.length || 1)} isInt />
                    <CompareRow label="场均分钟" seasonVal={seasonData.mp} careerVal={c.mp} />
                    <CompareRow label="场均得分" seasonVal={seasonData.pts} careerVal={c.pts} />
                    <CompareRow label="场均篮板" seasonVal={seasonData.reb} careerVal={c.reb} />
                    <CompareRow label="场均助攻" seasonVal={seasonData.ast} careerVal={c.ast} />
                    <CompareRow label="投篮命中率" seasonVal={seasonData.fgPct} careerVal={c.fgPct} isPct />
                    <CompareRow label="三分命中率" seasonVal={seasonData.tpPct} careerVal={c.tpPct} isPct />
                    <CompareRow label="真实命中率" seasonVal={seasonData.tsPct} careerVal={c.tsPct} isPct />
                    {seasonData.ftPct !== undefined && seasonData.ftPct !== null && (
                      <CompareRow label="罚球命中率" seasonVal={seasonData.ftPct} careerVal={null} isPct />
                    )}
                    {seasonData.stl !== undefined && seasonData.stl !== null && (
                      <CompareRow label="场均抢断" seasonVal={seasonData.stl} careerVal={c.stl} />
                    )}
                    {seasonData.blk !== undefined && seasonData.blk !== null && (
                      <CompareRow label="场均盖帽" seasonVal={seasonData.blk} careerVal={c.blk} />
                    )}
                    {seasonData.tov !== undefined && seasonData.tov !== null && (
                      <CompareRow label="场均失误" seasonVal={seasonData.tov} careerVal={c.tov} higherIsBetter={false} />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              Section 3: Season Navigator
              ══════════════════════════════════ */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">赛季导航</h2>
            <div className="flex items-center justify-between gap-4">
              {prevSeason ? (
                <Link
                  href={`/player/${player.id}/season/${prevSeason.season}`}
                  className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">上一赛季</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">&larr; {prevSeason.season}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmt(prevSeason.pts)} PPG / {fmt(prevSeason.reb)} RPG / {fmt(prevSeason.ast)} APG
                  </p>
                </Link>
              ) : (
                <div className="flex-1" />
              )}

              {nextSeason ? (
                <Link
                  href={`/player/${player.id}/season/${nextSeason.season}`}
                  className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 px-4 py-3 hover:shadow-md hover:border-slate-300 transition-all text-right group"
                >
                  <p className="text-xs text-slate-400 group-hover:text-slate-500 transition-colors">下一赛季</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{nextSeason.season} &rarr;</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {fmt(nextSeason.pts)} PPG / {fmt(nextSeason.reb)} RPG / {fmt(nextSeason.ast)} APG
                  </p>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>

          {/* ══════════════════════════════════
              Section 4: All Seasons Quick View
              ══════════════════════════════════ */}
          {allSeasons.length > 1 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                全部赛季 <span className="text-sm font-normal text-slate-400">({allSeasons.length} 个赛季)</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {allSeasons.map((s) => (
                  <Link
                    key={s.season}
                    href={`/player/${player.id}/season/${s.season}`}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      s.season === season
                        ? "bg-gradient-to-r from-[#C8102E] to-[#1D428A] text-white border-transparent shadow-md font-bold"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:shadow-sm"
                    }`}
                  >
                    {s.season}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════
              Section 5: Honors (if any)
              ══════════════════════════════════ */}
          {(seasonData.mvp || seasonData.fmvp) ? (
            <div className="mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">赛季荣誉</h2>
              <div className="flex flex-wrap gap-3">
                {seasonData.mvp ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="text-xl">&#127942;</span>
                    <span className="text-sm font-bold text-amber-800">常规赛 MVP</span>
                  </div>
                ) : null}
                {seasonData.fmvp ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                    <span className="text-xl">&#127942;</span>
                    <span className="text-sm font-bold text-amber-800">总决赛 MVP</span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </main>

        {/* ── Footer ── */}
        <SiteFooter />
      </div>
    </>
  );
}
