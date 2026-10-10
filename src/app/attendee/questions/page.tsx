// src/app/attendee/questions/page.tsx
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { fetchPublicNames } from "@/lib/profile-lookup";
import { QuestionsClient, type QuestionRow } from "./questions-client";

export const metadata: Metadata = { title: "My questions" };

export default async function AttendeeQuestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: raw, error } = await supabase
    .from("questions")
    .select(
      "id, body, asked_at, status, flagged, event_id, speaker_id, answers_attendee_safe (body, answered_at)",
    )
    .eq("attendee_id", user.id)
    .order("asked_at", { ascending: false });

  if (error) console.error("[attendee/questions] fetch failed:", error.message);

  const eventIds = Array.from(new Set((raw ?? []).map((q: any) => q.event_id)));
  const { data: events } = eventIds.length
    ? await supabase.from("events").select("id, title").in("id", eventIds)
    : { data: [] };
  const eventTitleById = new Map<string, string>(
    (events ?? []).map((e: { id: string; title: string }) => [e.id, e.title]),
  );

  const speakerNames = await fetchPublicNames(
    supabase,
    (raw ?? []).map((q: any) => q.speaker_id),
  );

  const questions: QuestionRow[] = (raw ?? []).map((q: any) => {
    const answer = Array.isArray(q.answers_attendee_safe)
      ? q.answers_attendee_safe[0]
      : q.answers_attendee_safe;
    return {
      id: q.id,
      body: q.body,
      asked_at: q.asked_at,
      status: q.status,
      flagged: Boolean(q.flagged),
      event_id: q.event_id,
      event_title: eventTitleById.get(q.event_id) ?? "Unknown event",
      speaker_id: q.speaker_id,
      speaker_name: speakerNames.get(q.speaker_id)?.full_name ?? "Speaker",
      answer: answer ? { body: answer.body, answered_at: answer.answered_at } : null,
    };
  });

  return (
    <>
      <QuestionsClient questions={questions} />
    </>
  );
}