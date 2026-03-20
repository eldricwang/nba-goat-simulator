import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getPlayerById, getPlayerSeason } from "@/lib/data";
import type { Player, PlayerSeason, CompareMode } from "@/lib/types";

export const runtime = "nodejs";

// Cache font loading
let fontData: ArrayBuffer | null = null;
async function loadFont(): Promise<ArrayBuffer> {
  if (fontData) return fontData;
  const fontPath = join(process.cwd(), "src/assets/fonts/NotoSansSC-Bold.otf");
  const buffer = await readFile(fontPath);
  fontData = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
  return fontData;
}

// ---- helpers (same logic as ShareCard, but simplified for OG) ----

type StatKey = "pts" | "reb" | "ast" | "tsPct" | "fgPct" | "tpPct";

interface StatDef {
  key: StatKey;
  label: string;
  unit?: string;
}

const STATS: StatDef[] = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "tsPct", label: "TS%", unit: "%" },
  { key: "fgPct", label: "FG%", unit: "%" },
  { key: "tpPct", label: "3P%", unit: "%" },
];

function getVal(
  player: Player,
  key: string,
  mode: CompareMode,
  seasonData?: PlayerSeason
): number | null {
  if (mode === "season" && seasonData) {
    return ((seasonData as Record<string, unknown>)[key] as number) ?? null;
  }
  return ((player.career as Record<string, unknown>)[key] as number) ?? null;
}

function fmt(val: number | null, unit?: string): string {
  if (val === null || val === undefined) return "\u2014";
  if (unit === "%") return val.toFixed(1);
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(1);
}

function headshotUrl(nbaId?: number | null): string | null {
  if (!nbaId) return null;
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const aId = searchParams.get("a") ?? "";
    const bId = searchParams.get("b") ?? "";
    const mode = (searchParams.get("mode") as CompareMode) || "career";
    const saLabel = searchParams.get("sa") ?? null;
    const sbLabel = searchParams.get("sb") ?? null;

    const playerA = getPlayerById(aId);
    const playerB = getPlayerById(bId);

    // Fallback if players not found
    if (!playerA || !playerB) {
      return new ImageResponse(
        (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #0f1923, #1a2740)",
              color: "white",
              fontSize: 48,
              fontWeight: 700,
              fontFamily: "NotoSansSC",
            }}
          >
            GOAT — NBA 球星对比器
          </div>
        ),
        {
          width: 1200,
          height: 630,
          fonts: [
            {
              name: "NotoSansSC",
              data: await loadFont(),
              style: "normal",
              weight: 700,
            },
          ],
        }
      );
    }

    const seasonDataA =
      playerA && saLabel ? getPlayerSeason(playerA.id, saLabel) : undefined;
    const seasonDataB =
      playerB && sbLabel ? getPlayerSeason(playerB.id, sbLabel) : undefined;

    const mvpA = getVal(playerA, "mvp", mode, seasonDataA) ?? 0;
    const fmvpA = getVal(playerA, "fmvp", mode, seasonDataA) ?? 0;
    const mvpB = getVal(playerB, "mvp", mode, seasonDataB) ?? 0;
    const fmvpB = getVal(playerB, "fmvp", mode, seasonDataB) ?? 0;

    const font = await loadFont();

    const headshotA = headshotUrl(playerA.nbaId);
    const headshotB = headshotUrl(playerB.nbaId);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: "NotoSansSC",
            background:
              "linear-gradient(170deg, #0f1923 0%, #1a2740 40%, #0d1b2a 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glows */}
          <div
            style={{
              position: "absolute",
              top: -80,
              left: -80,
              width: 400,
              height: 400,
              background:
                "radial-gradient(circle, rgba(200,16,46,0.2) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -80,
              right: -80,
              width: 400,
              height: 400,
              background:
                "radial-gradient(circle, rgba(29,66,138,0.25) 0%, transparent 70%)",
            }}
          />

          {/* === Top bar === */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "28px 48px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #C8102E, #1D428A)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900,
                  color: "white",
                }}
              >
                G
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    letterSpacing: 3,
                  }}
                >
                  GOAT
                </span>
                <span
                  style={{
                    fontSize: 9,
                    opacity: 0.4,
                    letterSpacing: 2,
                    marginTop: -2,
                  }}
                >
                  GREATEST OF ALL TIME
                </span>
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                borderRadius: 16,
                padding: "6px 20px",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              {mode === "career"
                ? "生涯数据"
                : `赛季 ${saLabel || ""}`}
            </div>
          </div>

          {/* === Main content: Players + Stats === */}
          <div
            style={{
              flex: 1,
              display: "flex",
              padding: "20px 48px 0",
              gap: 24,
            }}
          >
            {/* Left: Player A */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 200,
                paddingTop: 10,
              }}
            >
              {/* Headshot A */}
              {headshotA ? (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    border: "3px solid rgba(200,16,46,0.5)",
                    overflow: "hidden",
                    background: "#1a2740",
                    display: "flex",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headshotA}
                    alt=""
                    width={100}
                    height={100}
                    style={{
                      objectFit: "cover",
                      objectPosition: "top center",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #C8102E, #8B0000)",
                    border: "3px solid rgba(200,16,46,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    fontWeight: 900,
                  }}
                >
                  {playerA.nameEn.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
              )}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  marginTop: 12,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {playerA.nameZh}
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.45,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {playerA.nameEn}
              </div>
              {playerA.position && (
                <div
                  style={{
                    display: "flex",
                    marginTop: 8,
                    background: "rgba(200,16,46,0.2)",
                    borderRadius: 10,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#ff6b7a",
                  }}
                >
                  {playerA.position}
                </div>
              )}
            </div>

            {/* Center: Stats table */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0,
              }}
            >
              {/* VS header */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.15)",
                  letterSpacing: 6,
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                VS
              </div>

              {/* Stat rows */}
              {STATS.map((stat) => {
                const vA = getVal(playerA, stat.key, mode, seasonDataA);
                const vB = getVal(playerB, stat.key, mode, seasonDataB);
                const both = vA !== null && vB !== null;
                const aWins = both && vA! > vB!;
                const bWins = both && vB! > vA!;

                return (
                  <div
                    key={stat.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* A value */}
                    <div
                      style={{
                        flex: 1,
                        textAlign: "right",
                        paddingRight: 16,
                        fontSize: 18,
                        fontWeight: aWins ? 800 : 500,
                        color: aWins
                          ? "#ff6b7a"
                          : "rgba(255,255,255,0.35)",
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {fmt(vA, stat.unit)}
                      {aWins && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#C8102E",
                          }}
                        />
                      )}
                    </div>
                    {/* Label */}
                    <div
                      style={{
                        width: 60,
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.35)",
                        letterSpacing: 1,
                      }}
                    >
                      {stat.label}
                    </div>
                    {/* B value */}
                    <div
                      style={{
                        flex: 1,
                        textAlign: "left",
                        paddingLeft: 16,
                        fontSize: 18,
                        fontWeight: bWins ? 800 : 500,
                        color: bWins
                          ? "#6b9bff"
                          : "rgba(255,255,255,0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {bWins && (
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#1D428A",
                          }}
                        />
                      )}
                      {fmt(vB, stat.unit)}
                    </div>
                  </div>
                );
              })}

              {/* Honors row */}
              <div
                style={{
                  display: "flex",
                  marginTop: 10,
                  padding: "10px 0 0",
                  borderTop: "1px solid rgba(255,215,0,0.15)",
                  justifyContent: "center",
                  gap: 32,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: mvpA > mvpB ? 800 : 500,
                      color:
                        mvpA > mvpB
                          ? "#ffd700"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {mvpA}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,215,0,0.5)",
                      letterSpacing: 1,
                    }}
                  >
                    MVP
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: mvpB > mvpA ? 800 : 500,
                      color:
                        mvpB > mvpA
                          ? "#ffd700"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {mvpB}
                  </span>
                </div>
                <div
                  style={{
                    width: 1,
                    height: 20,
                    background: "rgba(255,215,0,0.15)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: fmvpA > fmvpB ? 800 : 500,
                      color:
                        fmvpA > fmvpB
                          ? "#ffd700"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {fmvpA}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "rgba(255,215,0,0.5)",
                      letterSpacing: 1,
                    }}
                  >
                    FMVP
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      fontWeight: fmvpB > fmvpA ? 800 : 500,
                      color:
                        fmvpB > fmvpA
                          ? "#ffd700"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {fmvpB}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Player B */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 200,
                paddingTop: 10,
              }}
            >
              {/* Headshot B */}
              {headshotB ? (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    border: "3px solid rgba(29,66,138,0.5)",
                    overflow: "hidden",
                    background: "#1a2740",
                    display: "flex",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={headshotB}
                    alt=""
                    width={100}
                    height={100}
                    style={{
                      objectFit: "cover",
                      objectPosition: "top center",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #1D428A, #0a1e4a)",
                    border: "3px solid rgba(29,66,138,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 36,
                    fontWeight: 900,
                  }}
                >
                  {playerB.nameEn.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
              )}
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  marginTop: 12,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {playerB.nameZh}
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.45,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {playerB.nameEn}
              </div>
              {playerB.position && (
                <div
                  style={{
                    display: "flex",
                    marginTop: 8,
                    background: "rgba(29,66,138,0.2)",
                    borderRadius: 10,
                    padding: "3px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#6b9bff",
                  }}
                >
                  {playerB.position}
                </div>
              )}
            </div>
          </div>

          {/* === Bottom watermark === */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 48px 20px",
              opacity: 0.25,
            }}
          >
            <span style={{ fontSize: 11, letterSpacing: 2 }}>
              GOAT 对比器
            </span>
            <span style={{ fontSize: 11 }}>数据仅供参考</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "NotoSansSC",
            data: font,
            style: "normal",
            weight: 700,
          },
        ],
      }
    );
  } catch (e) {
    console.error("OG image generation error:", e);
    // Return a simple fallback
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0f1923, #1a2740)",
            color: "white",
            fontSize: 48,
            fontWeight: 700,
          }}
        >
          GOAT — NBA Comparator
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
