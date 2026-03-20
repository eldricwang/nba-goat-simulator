/**
 * Get NBA player headshot URL from CDN.
 * Falls back to a placeholder with player initial.
 */
export function getHeadshotUrl(nbaId?: number | null): string | null {
  if (!nbaId) return null;
  return `https://cdn.nba.com/headshots/nba/latest/1040x760/${nbaId}.png`;
}

/**
 * Get player initials for fallback avatar.
 */
export function getPlayerInitials(nameEn: string): string {
  const parts = nameEn.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return nameEn.charAt(0).toUpperCase();
}
