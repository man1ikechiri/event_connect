// src/app/attendee/my-events/page.tsx
import type { Metadata } from "next";
import { CalendarCheck2, MapPin, Video, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";
import { AttendeeRespondButtons } from "@/app/attendee/my-events/respond-buttons";
import { AskQuestionForm } from "@/app/attendee/my-events/ask-question-form";
import { fetchPublicNames } from "@/lib/profile-lookup";

export const metadata: Metadata = { title: "My events" };

export default async function AttendeeMyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: registrations } = await supabase
    .from("event_attendee_registrations")
    .select(
      "id, status, events:event_id (id, title, start_datetime, end_datetime, venue_label, is_virtual)",
    )
    .eq("attendee_user_id", user.id)
    .order("registered_at", { ascending: false });

  const mapped = (registrations ?? []).map((r: any) => ({
    ...r,
    event: Array.isArray(r.events) ? r.events[0] : r.events,
  }));

  const activatedEventIds = mapped.filter((r) => r.status === "activated").map((r) => r.event.id);

  // NOTE: no embedded `users:` join here. That join relies on a FK that
  // PostgREST can't resolve, which makes the whole query error out and
  // silently return no rows. We fetch invites plainly and resolve names
  // via the SECURITY DEFINER RPC below.
  let speakerRows: { event_id: string; session_title: string | null; speaker_user_id: string }[] = [];
  if (activatedEventIds.length) {
    const { data, error } = await supabase
      .from("event_speaker_invites")
      .select("event_id, session_title, speaker_user_id")
      .in("event_id", activatedEventIds)
      .eq("status", "activated");

    if (error) {
      console.error("[attendee/my-events] speaker invite fetch failed:", error.message);
    }
    speakerRows = (data ?? []) as typeof speakerRows;
  }

  const speakerNames = await fetchPublicNames(
    supabase,
    speakerRows.map((s) => s.speaker_user_id),
  );

  const speakersByEvent = new Map<string, typeof speakerRows>();
  for (const row of speakerRows) {
    const list = speakersByEvent.get(row.event_id) ?? [];
    list.push(row);
    speakersByEvent.set(row.event_id, list);
  }

  return (
    <>
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          My events
        </h1>
        {mapped.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={CalendarCheck2} title="No events yet" description="Registrations will appear here." />
          </div>
        ) : (
          <ul className="space-y-4">
            {mapped.map((r) => (
              <li key={r.id} className="rounded-card border border-surface-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{r.event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                      {r.event.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                      {formatEventRange(r.event.start_datetime, r.event.end_datetime)} · {r.event.venue_label}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>

                {r.status === "invited" && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <AttendeeRespondButtons registrationId={r.id} />
                  </div>
                )}

                {r.status === "activated" && (
                  <div className="mt-4 border-t border-surface-border pt-4">
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400">
                      <Mic className="size-3.5" aria-hidden />
                      Speakers
                    </p>
                    {(speakersByEvent.get(r.event.id) ?? []).length === 0 ? (
                      <p className="text-sm text-navy-400">No confirmed speakers yet — check back closer to the event.</p>
                    ) : (
                      <ul className="space-y-3">
                        {(speakersByEvent.get(r.event.id) ?? []).map((s) => {
                          const speakerName = speakerNames.get(s.speaker_user_id)?.full_name ?? "Confirmed speaker";
                          return (
                            <li key={s.speaker_user_id}>
                              <p className="text-sm font-medium text-navy">{speakerName}</p>
                              <p className="text-xs text-navy-400">{s.session_title || "Session title TBA"}</p>
                              <AskQuestionForm
                                eventId={r.event.id}
                                speakerId={s.speaker_user_id}
                                speakerName={speakerName}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}