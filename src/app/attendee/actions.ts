// src/app/attendee/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/organizer/actions";

const registerSchema = z.object({
  event_id: z.string().uuid(),
  organization_affiliation: z.string().trim().max(200).optional().default(""),
});

export async function registerForEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/events/${formData.get("event_id")}`)}`);

  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  // Self-registration collects every required field in one step, so per
  // Section 5's attendee-activation rule ("registration/required profile
  // fields complete"), the registration is activated immediately — there's
  // no separate accept step when nobody invited them.
  const { error } = await supabase.from("event_attendee_registrations").insert({
    event_id: parsed.data.event_id,
    attendee_user_id: user.id,
    organization_affiliation: parsed.data.organization_affiliation || null,
    status: "activated",
    responded_at: new Date().toISOString(),
    activated_at: new Date().toISOString(),
  } as never);

  if (error) {
    return { error: error.message.includes("duplicate") ? "You're already registered for this event." : error.message };
  }

  redirect(
    `/thank-you?message=${encodeURIComponent("You're registered. We'll email you if the speaker lineup changes.")}&next=/attendee/dashboard&nextLabel=${encodeURIComponent("Go to my dashboard")}`,
  );
}

/**
 * For an organizer-invited attendee, there's no separate profile-completion
 * step in this build — required fields are already on file from sign-up —
 * so accepting activates immediately, same as self-registration does.
 */
export async function respondToAttendeeInvite(registrationId: string, decision: "accepted" | "declined") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("transition_role_status", {
    p_table: "event_attendee_registrations",
    p_row_id: registrationId,
    p_new_status: decision,
    p_actor: user.id,
  } as never);
  if (error) return { error: error.message };

  if (decision === "accepted") {
    const { error: activateErr } = await supabase.rpc("transition_role_status", {
      p_table: "event_attendee_registrations",
      p_row_id: registrationId,
      p_new_status: "activated",
      p_actor: user.id,
    } as never);
    if (activateErr) return { error: activateErr.message };
  }

  revalidatePath("/attendee/my-events");
  revalidatePath("/attendee/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------
// Ask a question — gated on BOTH parties being activated for this event.
// This is deliberately independent of the event's Planned/Live/Completed
// status: what matters is that the attendee is confirmed and the speaker
// they're asking is confirmed, not what stage the event itself is at.
// ---------------------------------------------------------------------
const askSchema = z.object({
  event_id: z.string().uuid(),
  speaker_id: z.string().uuid(),
  body: z.string().trim().min(5, "Question needs at least 5 characters."),
});

export async function askQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = askSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const [{ data: registration }, { data: speakerInvite }] = (await Promise.all([
    supabase
      .from("event_attendee_registrations")
      .select("status")
      .eq("event_id", parsed.data.event_id)
      .eq("attendee_user_id", user.id)
      .maybeSingle(),
    supabase
      .from("event_speaker_invites")
      .select("status")
      .eq("event_id", parsed.data.event_id)
      .eq("speaker_user_id", parsed.data.speaker_id)
      .maybeSingle(),
  ])) as [
    { data: { status: string } | null },
    { data: { status: string } | null },
  ];

  if (!registration || registration.status !== "activated") {
    return { error: "You need to be a confirmed attendee of this event before asking a question." };
  }
  if (!speakerInvite || speakerInvite.status !== "activated") {
    return { error: "This speaker hasn't been confirmed for this event yet." };
  }

  const { error } = await supabase.from("questions").insert({
    event_id: parsed.data.event_id,
    speaker_id: parsed.data.speaker_id,
    attendee_id: user.id,
    body: parsed.data.body,
  } as never);
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: parsed.data.speaker_id,
    type: "question_received",
    payload: { event_id: parsed.data.event_id },
  } as never);

  revalidatePath("/attendee/questions");
  revalidatePath("/attendee/my-events");
  return { success: true };
}