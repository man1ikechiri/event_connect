"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireOrganizer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type ActionState = { error?: string; success?: boolean };

// ---------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------
const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title needs at least 3 characters."),
    description: z.string().trim().max(2000).optional().default(""),
    venue_label: z.string().trim().min(1, "Add a venue or say it's virtual."),
    is_virtual: z.coerce.boolean().optional().default(false),
    virtual_link: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
    start_datetime: z.string().min(1, "Start date/time is required."),
    end_datetime: z.string().min(1, "End date/time is required."),
    capacity: z.coerce.number().int().positive().optional().or(z.literal("")),
  })
  .refine((data) => new Date(data.end_datetime) > new Date(data.start_datetime), {
    message: "End time must be after the start time.",
    path: ["end_datetime"],
  });

export async function createEvent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOrganizer();

  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      venue_label: parsed.data.venue_label,
      is_virtual: parsed.data.is_virtual,
      virtual_link: parsed.data.virtual_link || null,
      start_datetime: new Date(parsed.data.start_datetime).toISOString(),
      end_datetime: new Date(parsed.data.end_datetime).toISOString(),
      capacity: parsed.data.capacity || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/organizer/events");
  revalidatePath("/organizer/dashboard");
  redirect(`/organizer/events/${data.id}/details`);
}

// ---------------------------------------------------------------------
// Speaker invites
// ---------------------------------------------------------------------
const inviteSpeakerSchema = z.object({
  event_id: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email address."),
  session_title: z.string().trim().max(200).optional().default(""),
});

export async function inviteSpeaker(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOrganizer();
  const parsed = inviteSpeakerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", parsed.data.event_id)
    .single();
  if (!event || event.organizer_id !== user.id) return { error: "Event not found." };

  // Find the invitee by email via a SECURITY DEFINER RPC — a direct
  // `.from("users").select()` here would be silently blocked by RLS,
  // since the organizer isn't allowed to read another user's row
  // directly (Section 3: one users row per email; someone can be
  // invited before they've ever signed in — their row is created on
  // first login).
  const { data: existingId } = await supabase.rpc("lookup_user_id_by_email", {
    p_email: parsed.data.email.toLowerCase(),
  });

  if (!existingId) {
    return {
      error:
        "That email hasn't signed in to EventConnect yet. Ask them to sign in once, then invite them again.",
    };
  }

  const { error } = await supabase.from("event_speaker_invites").insert({
    event_id: parsed.data.event_id,
    speaker_user_id: existingId,
    session_title: parsed.data.session_title,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "This person is already invited." : error.message };
  }

  await supabase.from("audit_log").insert({
    actor_user_id: user.id,
    action_type: "speaker_invited",
    target_type: "event_speaker_invites",
    metadata: { event_id: parsed.data.event_id, email: parsed.data.email },
  });

  revalidatePath(`/organizer/events/${parsed.data.event_id}/speakers`);
  return { success: true };
}

// ---------------------------------------------------------------------
// Partner invites
// ---------------------------------------------------------------------
const invitePartnerSchema = z.object({
  event_id: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email address."),
  partner_type_id: z.string().uuid("Choose a partner type."),
  org_name: z.string().trim().max(200).optional().default(""),
});

export async function invitePartner(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOrganizer();
  const parsed = invitePartnerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", parsed.data.event_id)
    .single();
  if (!event || event.organizer_id !== user.id) return { error: "Event not found." };

  const { data: existingId } = await supabase.rpc("lookup_user_id_by_email", {
    p_email: parsed.data.email.toLowerCase(),
  });

  if (!existingId) {
    return {
      error:
        "That email hasn't signed in to EventConnect yet. Ask them to sign in once, then invite them again.",
    };
  }

  const { error } = await supabase.from("event_partner_invites").insert({
    event_id: parsed.data.event_id,
    partner_user_id: existingId,
    partner_type_id: parsed.data.partner_type_id,
    org_name: parsed.data.org_name,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "This person is already invited." : error.message };
  }

  revalidatePath(`/organizer/events/${parsed.data.event_id}/partners`);
  return { success: true };
}

// ---------------------------------------------------------------------
// Attendee registrations — organizer-invited path (Section 8/19: entry
// mode is still open, so both self-registration and organizer invite
// write to the same table).
// ---------------------------------------------------------------------
const inviteAttendeeSchema = z.object({
  event_id: z.string().uuid(),
  email: z.string().trim().email("Enter a valid email address."),
  organization_affiliation: z.string().trim().max(200).optional().default(""),
});

export async function inviteAttendee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, user } = await requireOrganizer();
  const parsed = inviteAttendeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", parsed.data.event_id)
    .single();
  if (!event || event.organizer_id !== user.id) return { error: "Event not found." };

  const { data: existingId } = await supabase.rpc("lookup_user_id_by_email", {
    p_email: parsed.data.email.toLowerCase(),
  });

  if (!existingId) {
    return {
      error:
        "That email hasn't signed in to EventConnect yet. Ask them to sign in once, then invite them again.",
    };
  }

  const { error } = await supabase.from("event_attendee_registrations").insert({
    event_id: parsed.data.event_id,
    attendee_user_id: existingId,
    organization_affiliation: parsed.data.organization_affiliation || null,
    invited_by: user.id,
  });

  if (error) {
    return { error: error.message.includes("duplicate") ? "This person is already registered." : error.message };
  }

  revalidatePath(`/organizer/events/${parsed.data.event_id}/attendees`);
  return { success: true };
}

// ---------------------------------------------------------------------
// Role status transitions (suspend, reachable from Invites tab AND the
// flagged Q&A queue — Section 5)
// ---------------------------------------------------------------------
const ROLE_TABLES = ["event_speaker_invites", "event_partner_invites", "event_attendee_registrations"] as const;
type RoleTable = (typeof ROLE_TABLES)[number];

export async function suspendRole(table: RoleTable, rowId: string, eventPathSlug: string) {
  const { supabase, user } = await requireOrganizer();
  const { error } = await supabase.rpc("transition_role_status", {
    p_table: table,
    p_row_id: rowId,
    p_new_status: "suspended",
    p_actor: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(eventPathSlug);
  return { success: true };
}

// ---------------------------------------------------------------------
// Q&A moderation (Section 6, 15) — "Process Q&A"
// ---------------------------------------------------------------------
export async function flagContent(
  targetType: "question" | "answer",
  targetId: string,
  reason: string,
) {
  const { supabase, user } = await requireOrganizer();
  const { error } = await supabase.from("moderation_flags").insert({
    target_type: targetType,
    target_id: targetId,
    flagged_by: user.id,
    reason,
  });
  if (error) return { error: error.message };

  if (targetType === "question") {
    await supabase.from("questions").update({ flagged: true, flagged_reason: reason, flagged_by: user.id }).eq(
      "id",
      targetId,
    );
  }

  revalidatePath("/organizer/process");
  return { success: true };
}

export async function resolveModerationFlag(flagId: string, status: "reviewed" | "dismissed") {
  const { supabase, user } = await requireOrganizer();
  const { error } = await supabase
    .from("moderation_flags")
    .update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", flagId);
  if (error) return { error: error.message };
  revalidatePath("/organizer/process");
  return { success: true };
}