// src/lib/utils/placeholder-images.ts

// Curated Pexels stock photos used as speaker hero images until real
// photos are uploaded. Picking is deterministic by user ID, so the same
// speaker always gets the same image across sessions.
const PEXELS_HEROES = [
  "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=880",
  "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/32326229/pexels-photo-32326229.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800",
  "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800",
];

export function heroImageFor(seed: string): string {
  const hash = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PEXELS_HEROES[Math.abs(hash) % PEXELS_HEROES.length]!;
}

/** Two-letter initials for avatar fallbacks. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.slice(0, 2).toUpperCase() ?? "?";
  const first = parts[0]?.[0];
  const last = parts[parts.length - 1]?.[0];
  return first && last ? (first + last).toUpperCase() : "?";
}