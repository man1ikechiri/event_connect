import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { QaInbox } from "@/app/speaker/qa/qa-inbox";

export const metadata: Metadata = { title: "Q&A inbox" };

export default async function SpeakerQaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: questions } = await supabase
    .from("questions")
    .select("id, body, asked_at, status, event_id, events:event_id (title), attendee:attendee_id (full_name)")
    .eq("speaker_id", user.id)
    .order("asked_at", { ascending: false });

  const mapped = (questions ?? []).map((q: any) => ({
    id: q.id,
    body: q.body,
    asked_at: q.asked_at,
    status: q.status,
    event_id: q.event_id,
    event_title: Array.isArray(q.events) ? q.events[0]?.title : q.events?.title,
    attendee_name: Array.isArray(q.attendee) ? q.attendee[0]?.full_name : q.attendee?.full_name,
  }));

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Q&A Inbox
        </h1>
        <QaInbox questions={mapped} />
      </main>
    </>
  );
}
