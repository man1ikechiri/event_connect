// src/app/organizer/events/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, MapPin, Video, CalendarDays, Mic, Users, Handshake, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventRange, relativeTime } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Events" };

interface RawEvent {
  id: string;
  title: string;
  start_datetime: string;
  end_datetime: string;
  venue_label: string;
  is_virtual: boolean;
  status: string;
}

interface EnrichedEvent extends RawEvent {
  speakerCount: number;
  attendeeCount: number;
  partnerCount: number;
  recentQuestions: { id: string; body: string; asked_at: string }[];
}

export default async function OrganizerEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();

  const [{ data: live }, { data: planned }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, is_virtual, status")
      .eq("organizer_id", user.id)
      .lte("start_datetime", nowIso)
      .gte("end_datetime", nowIso)
      .order("start_datetime"),
    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, is_virtual, status")
      .eq("organizer_id", user.id)
      .gt("start_datetime", nowIso)
      .order("start_datetime"),
    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, is_virtual, status")
      .eq("organizer_id", user.id)
      .lt("end_datetime", nowIso)
      .order("end_datetime", { ascending: false }),
  ]);

  const all: RawEvent[] = [...(live ?? []), ...(planned ?? []), ...(past ?? [])];
  const allIds = all.map((e) => e.id);

  let speakerMap = new Map<string, number>();
  let attendeeMap = new Map<string, number>();
  let partnerMap = new Map<string, number>();
  let questionsMap = new Map<string, { id: string; body: string; asked_at: string }[]>();

  if (allIds.length) {
    const [speakerRows, attendeeRows, partnerRows, questionRows] = await Promise.all([
      supabase
        .from("event_speaker_invites")
        .select("event_id, status")
        .in("event_id", allIds)
        .in("status", ["accepted", "activated"]),
      supabase
        .from("event_attendee_registrations")
        .select("event_id, status")
        .in("event_id", allIds)
        .in("status", ["accepted", "activated"]),
      supabase
        .from("event_partner_invites")
        .select("event_id, status")
        .in("event_id", allIds)
        .in("status", ["accepted", "activated"]),
      supabase
        .from("questions")
        .select("id, event_id, body, asked_at")
        .in("event_id", allIds)
        .order("asked_at", { ascending: false }),
    ]);

    const tally = (rows: { event_id: string }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) m.set(r.event_id, (m.get(r.event_id) ?? 0) + 1);
      return m;
    };

    speakerMap = tally(speakerRows.data);
    attendeeMap = tally(attendeeRows.data);
    partnerMap = tally(partnerRows.data);

    for (const q of questionRows.data ?? []) {
      const list = questionsMap.get(q.event_id) ?? [];
      if (list.length < 2) list.push({ id: q.id, body: q.body, asked_at: q.asked_at });
      questionsMap.set(q.event_id, list);
    }
  }

  const enrich = (events: RawEvent[]): EnrichedEvent[] =>
    events.map((e) => ({
      ...e,
      speakerCount: speakerMap.get(e.id) ?? 0,
      attendeeCount: attendeeMap.get(e.id) ?? 0,
      partnerCount: partnerMap.get(e.id) ?? 0,
      recentQuestions: questionsMap.get(e.id) ?? [],
    }));

  return (
    <>
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Events at a Glance
        </h1>
        <EventGroup label="Live events" events={enrich(live ?? [])} showQuestions />
        <EventGroup label="Planned events" events={enrich(planned ?? [])} />
        <EventGroup label="Past events" events={enrich(past ?? [])} showQuestions />
      </main>
    </>
  );
}

function EventGroup({
  label,
  events,
  showQuestions = false,
}: {
  label: string;
  events: EnrichedEvent[];
  showQuestions?: boolean;
}) {
  return (
    <section>
      <details className="group" open={events.length > 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between py-2">
          <h2 className="text-base font-semibold text-navy">
            {label} <span className="ml-1 font-normal text-navy-400">({events.length})</span>
          </h2>
          <span className="text-sm text-navy-500 transition-transform group-open:rotate-180">▾</span>
        </summary>

        {events.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={CalendarDays} title="Nothing here yet" description={`No ${label.toLowerCase()} right now.`} />
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {events.map((event) => (
              <li key={event.id} className="rounded-card border border-surface-border bg-white">
                <Link
                  href={`/organizer/events/${event.id}/details`}
                  className="block px-5 py-4 hover:bg-surface-muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{event.title}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                        {event.is_virtual ? (
                          <Video className="size-3.5 shrink-0" aria-hidden />
                        ) : (
                          <MapPin className="size-3.5 shrink-0" aria-hidden />
                        )}
                        <span className="truncate">
                          {formatEventRange(event.start_datetime, event.end_datetime)} · {event.venue_label}
                        </span>
                      </p>
                    </div>
                    <StatusBadge status={event.status} kind="event" className="shrink-0" />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-navy-500">
                    <span className="flex items-center gap-1">
                      <Mic className="size-3.5" aria-hidden /> {event.speakerCount} speaker
                      {event.speakerCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden /> {event.attendeeCount} attendee
                      {event.attendeeCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Handshake className="size-3.5" aria-hidden /> {event.partnerCount} partner
                      {event.partnerCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  {showQuestions && event.recentQuestions.length > 0 && (
                    <div className="mt-3 border-t border-surface-border pt-3">
                      {event.recentQuestions.map((q) => (
                        <p key={q.id} className="flex items-start gap-1.5 text-xs text-navy-500">
                          <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                          <span className="line-clamp-1">{q.body}</span>
                          <span className="shrink-0 text-navy-400">· {relativeTime(q.asked_at)}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}