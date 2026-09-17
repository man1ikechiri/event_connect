import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { formatEventRange } from "@/lib/utils/dates";
import { ORGANIZER_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Events" };

export default async function OrganizerEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const nowIso = new Date().toISOString();

  const [{ data: live }, { data: planned }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, status")
      .eq("organizer_id", user.id)
      .lte("start_datetime", nowIso)
      .gte("end_datetime", nowIso)
      .order("start_datetime"),
    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, status")
      .eq("organizer_id", user.id)
      .gt("start_datetime", nowIso)
      .order("start_datetime"),
  ]);

  return (
    <>
      <Topbar
        title="Events"
        portalLabel="Organizer portal"
        navItems={ORGANIZER_NAV_ITEMS}
        actions={
          <Link href="/organizer/events/new">
            <Button size="sm" icon={<Plus className="size-4" aria-hidden />}>
              Create event
            </Button>
          </Link>
        }
      />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-8 md:px-8">
        <EventGroup label="Live events" events={live ?? []} />
        <EventGroup label="Planned events" events={planned ?? []} />
      </main>
    </>
  );
}

function EventGroup({
  label,
  events,
}: {
  label: string;
  events: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    venue_label: string;
    status: string;
  }[];
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
          <ul className="mt-2 divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/organizer/events/${event.id}/details`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{event.title}</p>
                    <p className="mt-0.5 truncate text-sm text-navy-500">
                      {formatEventRange(event.start_datetime, event.end_datetime)} · {event.venue_label}
                    </p>
                  </div>
                  <StatusBadge status={event.status} kind="event" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </details>
    </section>
  );
}
