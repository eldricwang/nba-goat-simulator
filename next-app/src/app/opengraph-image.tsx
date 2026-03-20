import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "GOAT — NBA Greatest Of All Time";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          position: "relative",
        }}
      >
        {/* Accent bar top */}
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

        {/* Basketball icon */}
        <div
          style={{
            fontSize: 80,
            marginBottom: 24,
            display: "flex",
          }}
        >
          🏀
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            background: "linear-gradient(135deg, #C8102E, #ef4444, #1D428A)",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: -2,
            display: "flex",
          }}
        >
          GOAT
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginTop: 12,
            display: "flex",
          }}
        >
          NBA Greatest Of All Time
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginTop: 24,
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span>800+ 球员</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>6700+ 赛季</span>
          <span style={{ color: "#475569" }}>·</span>
          <span>多维数据对比</span>
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
