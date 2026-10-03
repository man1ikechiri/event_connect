// src/app/partner/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/organizer/actions";

/**
 * Section 5: Partner activation requires the partner profile to be
 * complete — org details, logo, contact — on top of having accepted.
 * That data lives directly on the event_partner_invites row (it's
 * genuinely event-scoped, unlike a speaker's global professional
 * profile), so completeness is checked against that same row.
 */
async function maybeActivatePartnerInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inviteId: string,
  actorId: string,
) {
  const { data: inviteData } = await supabase
    .from("event_partner_invites")
    .select("id, status, org_name, logo_url, contact_email")
    .eq("id", inviteId)
    .maybeSingle();

  const invite = inviteData as {
    id: string;
    status: string;
    org_name: string | null;
    logo_url: string | null;
    contact_email: string | null;
  } | null;

  if (!invite || invite.status !== "accepted") return;

  const complete = Boolean(invite.org_name?.trim() && invite.logo_url?.trim() && invite.contact_email?.trim());
  if (!complete) return;

  await supabase.rpc("transition_role_status", {
    p_table: "event_partner_invites",
    p_row_id: invite.id,
    p_new_status: "activated",
    p_actor: actorId,
  } as never);
}

export async function respondToPartnerInvite(inviteId: string, decision: "accepted" | "declined") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("transition_role_status", {
    p_table: "event_partner_invites",
    p_row_id: inviteId,
    p_new_status: decision,
    p_actor: user.id,
  } as never);
  if (error) return { error: error.message };

  // If the org details were already filled in by the organizer at invite
  // time (possible today), accepting alone might already satisfy
  // completeness — check right away rather than waiting on a profile edit.
  if (decision === "accepted") {
    await maybeActivatePartnerInvite(supabase, inviteId, user.id);
  }

  revalidatePath("/partner/my-events");
  revalidatePath("/partner/dashboard");
  return { success: true };
}

const partnerProfileSchema = z.object({
  invite_id: z.string().uuid(),
  org_name: z.string().trim().min(2, "Organization name is required."),
  logo_url: z.string().trim().url("Enter a valid logo URL."),
  contact_email: z.string().trim().email("Enter a valid contact email."),
});

export async function updatePartnerProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = partnerProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error } = await supabase
    .from("event_partner_invites")
    .update({
      org_name: parsed.data.org_name,
      logo_url: parsed.data.logo_url,
      contact_email: parsed.data.contact_email,
    } as never)
    .eq("id", parsed.data.invite_id)
    .eq("partner_user_id", user.id);

  if (error) return { error: error.message };

  await maybeActivatePartnerInvite(supabase, parsed.data.invite_id, user.id);

  revalidatePath("/partner/my-events");
  revalidatePath("/partner/dashboard");
  return { success: true };
}