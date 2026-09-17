"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/onboarding");

  return { supabase, user };
}

export async function approveOrganizer(userId: string) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from("users").update({ organizer_status: "approved" }).eq("id", userId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_user_id: user.id,
    action_type: "organizer_approved",
    target_type: "users",
    target_id: userId,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function suspendAccount(userId: string) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase.from("users").update({ organizer_status: "suspended" }).eq("id", userId);
  if (error) return { error: error.message };

  await supabase.from("audit_log").insert({
    actor_user_id: user.id,
    action_type: "account_suspended",
    target_type: "users",
    target_id: userId,
  });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resolveFlag(flagId: string, status: "reviewed" | "dismissed") {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase
    .from("moderation_flags")
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", flagId);
  if (error) return { error: error.message };
  revalidatePath("/admin/moderation");
  return { success: true };
}
