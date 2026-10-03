// src/app/speaker/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/organizer/actions";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Section 5/7: a speaker is activated for ONE SPECIFIC EVENT once they
 * have a complete profile and at least one content-library item tied to
 * THAT event — content added for a different event never activates
 * this one. Called after any mutation that could satisfy that bar.
 */
async function maybeActivateSpeakerInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  eventId: string,
) {
  const [{ data: profile }, { count: contentCount }, { data: invite }] = await Promise.all([
    supabase.from("speaker_profiles").select("professional_title, company").eq("user_id", userId).maybeSingle(),
    supabase
      .from("content_library_items")
      .select("id", { count: "exact", head: true })
      .eq("speaker_id", userId)
      .eq("event_id", eventId),
    supabase
      .from("event_speaker_invites")
      .select("id, status")
      .eq("speaker_user_id", userId)
      .eq("event_id", eventId)
      .maybeSingle(),
  ]);

  const typedProfile = profile as { professional_title?: string | null; company?: string | null } | null;
  const typedInvite = invite as { id: string; status: string } | null;
  const profileComplete = Boolean(typedProfile?.professional_title && typedProfile.company);
  if (!profileComplete || !contentCount || !typedInvite || typedInvite.status !== "accepted") return;

  await (supabase.rpc as any)("transition_role_status", {
    p_table: "event_speaker_invites",
    p_row_id: typedInvite.id,
    p_new_status: "activated",
    p_actor: userId,
  });
}

// ---------------------------------------------------------------------
// Profile (Section 7 — structured fields only)
// ---------------------------------------------------------------------
const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required."),
  phone: z.string().trim().optional().default(""),
  professional_title: z.string().trim().min(2, "Professional title is required."),
  company: z.string().trim().min(2, "Company is required."),
  linkedin_url: z.string().trim().url("Enter a valid LinkedIn URL.").optional().or(z.literal("")),
  personal_website_url: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
});

export async function updateSpeakerProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { error: userErr } = await supabase
    .from("users")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null } as never)
    .eq("id", user.id);
  if (userErr) return { error: userErr.message };

  const { error: profileErr } = await supabase.from("speaker_profiles").upsert({
    user_id: user.id,
    professional_title: parsed.data.professional_title,
    company: parsed.data.company,
    linkedin_url: parsed.data.linkedin_url || null,
    personal_website_url: parsed.data.personal_website_url || null,
    updated_at: new Date().toISOString(),
  } as never);
  if (profileErr) return { error: profileErr.message };

  // Profile just became complete — re-check every accepted invite in
  // case any of them already had content waiting on this.
  const { data: acceptedInvites } = (await supabase
    .from("event_speaker_invites")
    .select("event_id")
    .eq("speaker_user_id", user.id)
    .eq("status", "accepted")) as {
    data: Array<{ event_id: string }> | null;
  };

  for (const invite of acceptedInvites ?? []) {
    await maybeActivateSpeakerInvite(supabase, user.id, invite.event_id);
  }

  revalidatePath("/speaker/profile");
  revalidatePath("/speaker/my-events");
  return { success: true };
}

// ---------------------------------------------------------------------
// Content library — event-scoped (Section 5/7)
// ---------------------------------------------------------------------
const contentSchema = z.object({
  event_id: z.string().uuid("Choose an event."),
  content_type_id: z.string().uuid("Choose a content type."),
  url: z.string().trim().url("Enter a valid URL."),
  title: z.string().trim().min(1, "Give this item a title."),
});

export async function addContentItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: invite } = (await supabase
    .from("event_speaker_invites")
    .select("status")
    .eq("event_id", parsed.data.event_id)
    .eq("speaker_user_id", user.id)
    .maybeSingle()) as {
    data: { status: string } | null;
  };

  if (!invite || !["accepted", "activated"].includes(invite.status)) {
    return { error: "You can only add content for an event you've accepted to speak at." };
  }

  const { data: contentType } = (await supabase
    .from("content_types")
    .select("slug, supports_rich_preview")
    .eq("id", parsed.data.content_type_id)
    .single()) as {
    data: { supports_rich_preview: boolean } | null;
  };

  const { error } = await supabase.from("content_library_items").insert({
    speaker_id: user.id,
    event_id: parsed.data.event_id,
    content_type_id: parsed.data.content_type_id,
    url: parsed.data.url,
    title: parsed.data.title,
    // YouTube/website previews resolve async via a background job in
    // production; phase-1 PDF/Doc/Presentation always get the icon card.
    preview_status: contentType?.supports_rich_preview ? "pending" : "ready",
  } as never);
  if (error) return { error: error.message };

  await maybeActivateSpeakerInvite(supabase, user.id, parsed.data.event_id);

  revalidatePath("/speaker/content-library");
  revalidatePath("/speaker/my-events");
  return { success: true };
}

export async function deleteContentItem(itemId: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("content_library_items").delete().eq("id", itemId).eq("speaker_id", user.id);
  revalidatePath("/speaker/content-library");
}

// ---------------------------------------------------------------------
// Invite response (Section 7 — accept/decline from My Events)
// ---------------------------------------------------------------------
export async function respondToSpeakerInvite(inviteId: string, decision: "accepted" | "declined") {
  const { supabase, user } = await requireUser();
  const { error } = await (supabase.rpc as any)("transition_role_status", {
    p_table: "event_speaker_invites",
    p_row_id: inviteId,
    p_new_status: decision,
    p_actor: user.id,
  });
  if (error) return { error: error.message };

  if (decision === "accepted") {
    const { data: invite } = (await supabase
      .from("event_speaker_invites")
      .select("event_id")
      .eq("id", inviteId)
      .single()) as { data: { event_id: string } | null };
    if (invite) await maybeActivateSpeakerInvite(supabase, user.id, invite.event_id);
  }

  revalidatePath("/speaker/my-events");
  revalidatePath("/speaker/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------
// Q&A inbox — multi-select bulk reply (Section 7)
// ---------------------------------------------------------------------
export async function replyToQuestions(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const body = String(formData.get("body") ?? "").trim();
  const questionIds = formData.getAll("question_ids").map(String);

  if (!body) return { error: "Write a reply before sending." };
  if (questionIds.length === 0) return { error: "Select at least one question." };

  // One answer record per question — each attendee sees an individual
  // reply — but they share an internal-only bulk_group_id when more than
  // one question was answered together (Section 7, 14).
  const bulkGroupId = questionIds.length > 1 ? randomUUID() : null;

  const { error } = await supabase.from("answers").insert(
    questionIds.map((questionId) => ({
      question_id: questionId,
      speaker_id: user.id,
      body,
      bulk_group_id: bulkGroupId,
    })) as never[],
  );
  if (error) return { error: error.message };

  await supabase.from("questions").update({ status: "answered" } as never).in("id", questionIds);

  // Notify each attendee (Section 16).
  const { data: questionRows } = await supabase
    .from("questions")
    .select("id, attendee_id")
    .in("id", questionIds);
  const questions = (questionRows ?? []) as Array<{ id: string; attendee_id: string }>;
  if (questions?.length) {
    await supabase.from("notifications").insert(
      questions.map((q) => ({
        user_id: q.attendee_id,
        type: "question_answered" as const,
        payload: { question_id: q.id },
      })) as never[],
    );
  }

  revalidatePath("/speaker/qa");
  return { success: true };
}