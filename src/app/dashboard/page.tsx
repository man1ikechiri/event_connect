import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * A person can hold several role badges at once (Section 3). Rather than
 * asking them to pick a portal on every sign-in, we route by priority:
 * admin > approved organizer > active speaker > active partner > attendee.
 * Someone with no role yet lands on role selection.
 */
export default async function DashboardRouter() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin, organizer_status")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) redirect("/admin/dashboard");
  if (profile?.organizer_status === "approved") redirect("/organizer/dashboard");

  const { count: speakerCount } = await supabase
    .from("event_speaker_invites")
    .select("id", { count: "exact", head: true })
    .eq("speaker_user_id", user.id);
  if (speakerCount && speakerCount > 0) redirect("/speaker/dashboard");

  const { count: partnerCount } = await supabase
    .from("event_partner_invites")
    .select("id", { count: "exact", head: true })
    .eq("partner_user_id", user.id);
  if (partnerCount && partnerCount > 0) redirect("/partner/dashboard");

  const { count: attendeeCount } = await supabase
    .from("event_attendee_registrations")
    .select("id", { count: "exact", head: true })
    .eq("attendee_user_id", user.id);
  if (attendeeCount && attendeeCount > 0) redirect("/attendee/dashboard");

  redirect("/onboarding");
}
