// src/app/organizer/dashboard/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Plus, MapPin, Video, ChevronRight, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatEventRange, dashboardDateRanges } from "@/lib/utils/dates";
import { HeroBanner } from "@/components/layout/hero-banner";

export const metadata: Metadata = { title: "Dashboard" };

export default async function OrganizerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ranges = dashboardDateRanges();
  const nowIso = new Date().toISOString();

  const [total, week, month, quarter, year, liveEvents, plannedEvents] = await Promise.all([
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .gte("start_datetime", ranges.week.gte)
      .lt("start_datetime", ranges.week.lt),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .gte("start_datetime", ranges.month.gte)
      .lt("start_datetime", ranges.month.lt),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .gte("start_datetime", ranges.quarter.gte)
      .lt("start_datetime", ranges.quarter.lt),

    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("organizer_id", user.id)
      .gte("start_datetime", ranges.year.gte)
      .lt("start_datetime", ranges.year.lt),

    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, is_virtual, status")
      .eq("organizer_id", user.id)
      .lte("start_datetime", nowIso)
      .gte("end_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(5),

    supabase
      .from("events")
      .select("id, title, start_datetime, end_datetime, venue_label, is_virtual, status")
      .eq("organizer_id", user.id)
      .gt("start_datetime", nowIso)
      .order("start_datetime", { ascending: true })
      .limit(5),
  ]);

  const stats = [
    { label: "Total events", value: total.count ?? 0 },
    { label: "This week", value: week.count ?? 0 },
    { label: "This month", value: month.count ?? 0 },
    { label: "This quarter", value: quarter.count ?? 0 },
    { label: "This year", value: year.count ?? 0 },
  ];

  return (
    <>
      <HeroBanner src="/images/hero-banner.png" />

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Hello! Good to have you back!
        </h1>
        <section aria-label="Event totals" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card border border-surface-border bg-white p-4">
              <p className="text-2xl font-semibold text-navy">{stat.value}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-navy-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <EventSection title="Live now" events={liveEvents.data ?? []} />
        <EventSection title="Planned" events={plannedEvents.data ?? []} />
      </main>
    </>
  );
}

// EventSection unchanged — leave as-is
function EventSection({
  title,
  events,
}: {
  title: string;
  events: {
    id: string;
    title: string;
    start_datetime: string;
    end_datetime: string;
    venue_label: string;
    is_virtual: boolean;
    status: string;
  }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        <Link href="/organizer/events" className="flex items-center text-sm font-medium text-navy-500 hover:text-navy">
          View all
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-card border border-dashed border-surface-border bg-white">
          <EmptyState
            icon={CalendarDays}
            title={`No ${title.toLowerCase()} events`}
            description="Events you organize will show up here as soon as their dates match this section."
          />
        </div>
      ) : (
        <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/organizer/events/${event.id}/details`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-muted"
              >
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}