import { ImageResponse } from "next/og";
import { getPlayerById, getPlayerSeason } from "@/lib/data";

export const runtime = "nodejs";
export const alt = "赛季数据";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string; season: string }>;
}) {
  const { id, season } = await params;
  const player = getPlayerById(id);
  const seasonData = player ? getPlayerSeason(id, season) : null;

  if (!player || !seasonData) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "#94a3b8",
            fontSize: 40,
          }}
        >
          数据未找到
        </div>
      ),
      { ...size }
    );
  }

  const fmt = (v: number | null | undefined, d = 1) =>
    v === null || v === undefined ? "—" : Number.isInteger(v) ? v.toString() : v.toFixed(d);

  const stats = [
    { label: "PPG", value: fmt(seasonData.pts) },
    { label: "RPG", value: fmt(seasonData.reb) },
    { label: "APG", value: fmt(seasonData.ast) },
    { label: "FG%", value: fmt(seasonData.fgPct) },
    { label: "GP", value: fmt(seasonData.gp, 0) },
  ];

  const c = player.career;
  // Compare to career: green up, red down
  const diffs = [
    { career: c.pts, season: seasonData.pts },
    { career: c.reb, season: seasonData.reb },
    { career: c.ast, season: seasonData.ast },
    { career: c.fgPct, season: seasonData.fgPct },
    { career: null, season: null }, // GP has no meaningful career avg per season
  ];

  const honors: string[] = [];
  if (seasonData.mvp) honors.push("MVP");
  if (seasonData.fmvp) honors.push("FMVP");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          position: "relative",
          padding: "48px 60px",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #C8102E, #1D428A)",
          }}
        />

        {/* Top section */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Avatar */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C8102E, #1D428A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 40,
              fontWeight: 900,
              flexShrink: 0,
            }}
          >
            {player.nameEn
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: "#f8fafc",
                lineHeight: 1.1,
                display: "flex",
              }}
            >
              {player.nameZh}
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#94a3b8",
                display: "flex",
              }}
            >
              {player.nameEn}
            </div>
          </div>

          {/* Season badge */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 900,
                background: "linear-gradient(135deg, #C8102E, #1D428A)",
                backgroundClip: "text",
                color: "transparent",
                display: "flex",
              }}
            >
              {season}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              {seasonData.team && (
                <div
                  style={{
                    fontSize: 16,
                    color: "#94a3b8",
                    background: "rgba(148,163,184,0.15)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    display: "flex",
                  }}
                >
                  {seasonData.team}
                </div>
              )}
              {honors.map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 16,
                    color: "#fbbf24",
                    background: "rgba(251,191,36,0.1)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  🏆 {h}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 48,
            flex: 1,
            alignItems: "center",
          }}
        >
          {stats.map((s, i) => {
            const d = diffs[i];
            let diffText = "";
            let diffColor = "#64748b";
            if (
              d &&
              d.career !== null &&
              d.career !== undefined &&
              d.season !== null &&
              d.season !== undefined
            ) {
              const diff = d.season - d.career;
              if (Math.abs(diff) > 0.05) {
                diffText = (diff > 0 ? "+" : "") + diff.toFixed(1);
                diffColor = diff > 0 ? "#4ade80" : "#f87171";
              }
            }

            return (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 16,
                  padding: "24px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    fontWeight: 900,
                    color: "#f8fafc",
                    display: "flex",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    color: "#64748b",
                    marginTop: 6,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                    display: "flex",
                  }}
                >
                  {s.label}
                </div>
                {diffText && (
                  <div
                    style={{
                      fontSize: 14,
                      color: diffColor,
                      marginTop: 6,
                      display: "flex",
                    }}
                  >
                    vs 生涯 {diffText}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <div style={{ fontSize: 18, color: "#475569", display: "flex" }}>
            GOAT — NBA Greatest Of All Time
          </div>
          <div style={{ fontSize: 14, color: "#334155", display: "flex" }}>
            goat.starcoby.com
          </div>
        </div>

        {/* Accent bar bottom */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #1D428A, #C8102E)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
