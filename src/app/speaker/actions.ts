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
 * Section 5 / 7: activation is automatic once a speaker has an accepted
 * invite, a complete profile, and at least one content item. Called after
 * any mutation that could satisfy that bar.
 */
async function maybeActivateSpeakerInvites(supabase: ReturnType<typeof createClient>, userId: string) {
  const [{ data: profile }, { count: contentCount }, { data: acceptedInvites }] = await Promise.all([
    supabase
      .from("speaker_profiles")
      .select("professional_title, company")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("content_library_items").select("id", { count: "exact", head: true }).eq("speaker_id", userId),
    supabase.from("event_speaker_invites").select("id").eq("speaker_user_id", userId).eq("status", "accepted"),
  ]);

  const profileComplete = Boolean(profile?.professional_title && profile?.company);
  if (!profileComplete || !contentCount) return;

  for (const invite of acceptedInvites ?? []) {
    await supabase.rpc("transition_role_status", {
      p_table: "event_speaker_invites",
      p_row_id: invite.id,
      p_new_status: "activated",
      p_actor: userId,
    });
  }
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
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (userErr) return { error: userErr.message };

  const { error: profileErr } = await supabase.from("speaker_profiles").upsert({
    user_id: user.id,
    professional_title: parsed.data.professional_title,
    company: parsed.data.company,
    linkedin_url: parsed.data.linkedin_url || null,
    personal_website_url: parsed.data.personal_website_url || null,
    updated_at: new Date().toISOString(),
  });
  if (profileErr) return { error: profileErr.message };

  await maybeActivateSpeakerInvites(supabase, user.id);

  revalidatePath("/speaker/profile");
  revalidatePath("/speaker/my-events");
  return { success: true };
}

// ---------------------------------------------------------------------
// Content library (Section 7 — links only, phase 1)
// ---------------------------------------------------------------------
const contentSchema = z.object({
  content_type_id: z.string().uuid("Choose a content type."),
  url: z.string().trim().url("Enter a valid URL."),
  title: z.string().trim().min(1, "Give this item a title."),
});

export async function addContentItem(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const parsed = contentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: contentType } = await supabase
    .from("content_types")
    .select("slug, supports_rich_preview")
    .eq("id", parsed.data.content_type_id)
    .single();

  const { error } = await supabase.from("content_library_items").insert({
    speaker_id: user.id,
    content_type_id: parsed.data.content_type_id,
    url: parsed.data.url,
    title: parsed.data.title,
    // YouTube/website previews resolve async via a background job in
    // production; phase-1 PDF/Doc/Presentation always get the icon card.
    preview_status: contentType?.supports_rich_preview ? "pending" : "ready",
  });
  if (error) return { error: error.message };

  await maybeActivateSpeakerInvites(supabase, user.id);

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
  const { error } = await supabase.rpc("transition_role_status", {
    p_table: "event_speaker_invites",
    p_row_id: inviteId,
    p_new_status: decision,
    p_actor: user.id,
  });
  if (error) return { error: error.message };

  if (decision === "accepted") await maybeActivateSpeakerInvites(supabase, user.id);

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
    })),
  );
  if (error) return { error: error.message };

  await supabase.from("questions").update({ status: "answered" }).in("id", questionIds);

  // Notify each attendee (Section 16).
  const { data: questions } = await supabase.from("questions").select("id, attendee_id").in("id", questionIds);
  if (questions?.length) {
    await supabase.from("notifications").insert(
      questions.map((q) => ({
        user_id: q.attendee_id,
        type: "question_answered" as const,
        payload: { question_id: q.id },
      })),
    );
  }

  revalidatePath("/speaker/qa");
  return { success: true };
}
