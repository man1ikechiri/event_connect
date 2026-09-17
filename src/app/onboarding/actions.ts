"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestOrganizerAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("users").update({ organizer_status: "pending" }).eq("id", user.id);
  await supabase.from("audit_log").insert({
    actor_user_id: user.id,
    action_type: "organizer_access_requested",
    target_type: "users",
    target_id: user.id,
  });

  redirect(
    `/thank-you?message=${encodeURIComponent(
      "Your organizer access request is with an admin for review. We'll email you once it's approved.",
    )}&next=/onboarding&nextLabel=${encodeURIComponent("Back to home")}`,
  );
}
