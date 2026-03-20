import playersData from "../../data/players.json";
import seasonsData from "../../data/seasons.json";
import type { Player, PlayerSeason } from "./types";

const players: Player[] = playersData as Player[];
const seasons: PlayerSeason[] = seasonsData as PlayerSeason[];

export function getAllPlayers(): Player[] {
  return players;
}

export function getPlayerById(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function searchPlayers(query: string): Player[] {
  if (!query.trim()) return players;
  const q = query.toLowerCase().trim();
  return players.filter(
    (p) =>
      p.nameZh.includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.id.includes(q)
  );
}

export function getPlayerSeasons(playerId: string): PlayerSeason[] {
  return seasons
    .filter((s) => s.playerId === playerId)
    .sort((a, b) => a.season.localeCompare(b.season));
}

export function getPlayerSeason(
  playerId: string,
  season: string
): PlayerSeason | undefined {
  return seasons.find((s) => s.playerId === playerId && s.season === season);
}

/** Get all unique seasons available for a player */
export function getAvailableSeasons(playerId: string): string[] {
  return getPlayerSeasons(playerId).map((s) => s.season);
}

/** Get seasons available for BOTH players */
export function getCommonSeasons(
  playerAId: string,
  playerBId: string
): string[] {
  const seasonsA = new Set(getAvailableSeasons(playerAId));
  const seasonsB = new Set(getAvailableSeasons(playerBId));
  const allSeasons = new Set([...seasonsA, ...seasonsB]);
  return Array.from(allSeasons).sort();
}
