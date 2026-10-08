// src/lib/auth/get-user-roles.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRoles } from "./roles";

export async function getUserRoles(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserRoles> {
  const [profileRes, speakerRes, partnerRes] = await Promise.all([
    supabase
      .from("users")
      .select("organizer_status, is_admin")
      .eq("id", userId)
      .single(),
    supabase
      .from("event_speaker_invites")
      .select("id", { count: "exact", head: true })
      .eq("speaker_user_id", userId)
      .in("status", ["accepted", "activated"]),
    supabase
      .from("event_partner_invites")
      .select("id", { count: "exact", head: true })
      .eq("partner_user_id", userId)
      .in("status", ["accepted", "activated"]),
  ]);

  const profile = profileRes.data;

  return {
    // Every authenticated user can register for events, so attendee is
    // always true. If you'd rather gate it on an activated registration,
    // swap to a count query like the speaker/partner checks above.
    isAttendee: true,
    isOrganizer: profile?.organizer_status === "approved",
    isSpeaker: (speakerRes.count ?? 0) > 0,
    isPartner: (partnerRes.count ?? 0) > 0,
    isAdmin: profile?.is_admin === true,
  };
}