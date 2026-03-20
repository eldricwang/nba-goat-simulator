import { MetadataRoute } from "next";
import { getAllPlayers, getPlayerSeasons } from "@/lib/data";

const BASE_URL = "https://nba-goat.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const players = getAllPlayers();
  const now = new Date().toISOString();

  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/compare`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/players`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // ── Player pages ──
  const playerPages: MetadataRoute.Sitemap = players.map((p) => ({
    url: `${BASE_URL}/player/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: p.career.mvp > 0 || p.career.fmvp > 0 ? 0.8 : 0.6,
  }));

  // ── Season pages ──
  const seasonPages: MetadataRoute.Sitemap = players.flatMap((p) => {
    const seasons = getPlayerSeasons(p.id);
    return seasons.map((s) => ({
      url: `${BASE_URL}/player/${p.id}/season/${s.season}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    }));
  });

  return [...staticPages, ...playerPages, ...seasonPages];
}
