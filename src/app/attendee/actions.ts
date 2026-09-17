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

  const { error } = await supabase.from("event_attendee_registrations").insert({
    event_id: parsed.data.event_id,
    attendee_user_id: user.id,
    organization_affiliation: parsed.data.organization_affiliation || null,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "You're already registered for this event." : error.message };
  }

  redirect(
    `/thank-you?message=${encodeURIComponent("You're registered. We'll email you if the speaker lineup changes.")}&next=/attendee/dashboard&nextLabel=${encodeURIComponent("Go to my dashboard")}`,
  );
}

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

  const { error } = await supabase.from("questions").insert({
    event_id: parsed.data.event_id,
    speaker_id: parsed.data.speaker_id,
    attendee_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: parsed.data.speaker_id,
    type: "question_received",
    payload: { event_id: parsed.data.event_id },
  });

  revalidatePath("/attendee/questions");
  return { success: true };
}
