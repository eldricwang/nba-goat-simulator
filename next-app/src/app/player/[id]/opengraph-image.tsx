import { ImageResponse } from "next/og";
import { getPlayerById } from "@/lib/data";

export const runtime = "nodejs";
export const alt = "球员数据";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = getPlayerById(id);

  if (!player) {
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
          球员未找到
        </div>
      ),
      { ...size }
    );
  }

  const c = player.career;
  const fmt = (v: number | null | undefined, d = 1) =>
    v === null || v === undefined ? "—" : Number.isInteger(v) ? v.toString() : v.toFixed(d);

  const stats = [
    { label: "PPG", value: fmt(c.pts) },
    { label: "RPG", value: fmt(c.reb) },
    { label: "APG", value: fmt(c.ast) },
    { label: "FG%", value: fmt(c.fgPct) },
    { label: "GP", value: fmt(c.gp, 0) },
  ];

  const honors: string[] = [];
  if (c.mvp > 0) honors.push(`${c.mvp}x MVP`);
  if (c.fmvp > 0) honors.push(`${c.fmvp}x FMVP`);
  if (c.rings && c.rings > 0) honors.push(`${c.rings}x Champ`);

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

        {/* Top section: player info */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Avatar circle */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C8102E, #1D428A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 48,
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

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontSize: 48,
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
                fontSize: 24,
                color: "#94a3b8",
                display: "flex",
              }}
            >
              {player.nameEn}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {player.position && (
                <div
                  style={{
                    fontSize: 16,
                    color: "#93c5fd",
                    background: "rgba(59,130,246,0.15)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    display: "flex",
                  }}
                >
                  {player.position}
                </div>
              )}
              {player.active !== undefined && (
                <div
                  style={{
                    fontSize: 16,
                    color: player.active ? "#86efac" : "#94a3b8",
                    background: player.active
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(148,163,184,0.15)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    display: "flex",
                  }}
                >
                  {player.active ? "现役" : "退役"}
                </div>
              )}
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
          {stats.map((s) => (
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
                  marginTop: 8,
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  display: "flex",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Honors row */}
        {honors.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 20,
              justifyContent: "center",
            }}
          >
            {honors.map((h) => (
              <div
                key={h}
                style={{
                  fontSize: 18,
                  color: "#fbbf24",
                  background: "rgba(251,191,36,0.1)",
                  padding: "6px 20px",
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                🏆 {h}
              </div>
            ))}
          </div>
        )}

        {/* Footer branding */}
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
