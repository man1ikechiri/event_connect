import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Video, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";

export const metadata: Metadata = {
  title: "Upcoming events",
  description: "Browse events open for registration on EventConnect.",
  alternates: { canonical: "/events" },
};

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, start_datetime, end_datetime, venue_label, is_virtual, status")
    .in("status", ["planned", "live"])
    .order("start_datetime", { ascending: true });

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-lg font-semibold text-navy">
          EventConnect
        </Link>
        <Link href="/login" className="rounded-control border border-navy px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-16">
        <h1 className="mb-6 text-2xl font-semibold text-navy">Upcoming events</h1>

        {!events || events.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border">
            <EmptyState icon={CalendarDays} title="Nothing open right now" description="Check back soon — new events are added regularly." />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-surface-muted">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                      {event.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                      {formatEventRange(event.start_datetime, event.end_datetime)} · {event.venue_label}
                    </p>
                  </div>
                  <StatusBadge status={event.status} kind="event" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
