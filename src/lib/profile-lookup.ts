// src/lib/profile-lookup.ts
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface PublicName {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface OrganizerContact extends PublicName {
  email: string;
  phone: string | null;
}

/** Name + avatar only, for any signed-in caller. Safe for cross-role display. */
export async function fetchPublicNames(
  supabase: SupabaseServerClient,
  ids: (string | null | undefined)[],
): Promise<Map<string, PublicName>> {
  const uniqueIds = Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
  const map = new Map<string, PublicName>();
  if (uniqueIds.length === 0) return map;

  const { data, error } = await supabase.rpc("public_profile_names", {
    p_user_ids: uniqueIds,
  } as never);
  if (error) {
    console.error("[profile-lookup] public_profile_names failed:", error.message);
    return map;
  }
  for (const row of (data ?? []) as OrganizerContact[]) map.set(row.id, row);
  return map;
}

/**
 * Full contact info for every participant across every event the caller
 * organizes. One call covers a whole page — cache the result rather than
 * calling this per-row.
 */
export async function fetchOrganizerContacts(
  supabase: SupabaseServerClient,
): Promise<Map<string, OrganizerContact>> {
  const { data, error } = await supabase.rpc("organizer_all_contacts");
  if (error) {
    console.error("[profile-lookup] organizer_all_contacts failed:", error.message);
    return new Map();
  }
  const map = new Map<string, OrganizerContact>();
  for (const row of (data ?? []) as OrganizerContact[]) map.set(row.id, row);
  return map;
}