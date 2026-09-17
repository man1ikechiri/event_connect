// src/app/attendee/dashboard/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { CalendarCheck2, Library, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AttendeeDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: registrations } = await supabase
    .from("event_attendee_registrations")
    .select("id, status, events:event_id (id, title, start_datetime, end_datetime, venue_label)")
    .eq("attendee_user_id", user.id)
    .order("registered_at", { ascending: false })
    .limit(5);

  return (
    <>
      <Topbar title="Dashboard" portalLabel="Attendee portal" navItems={ATTENDEE_NAV_ITEMS} />
      <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:px-8">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-navy">My events</h2>
            <Link href="/attendee/my-events" className="flex items-center text-sm font-medium text-navy-500 hover:text-navy">
              View all
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {!registrations || registrations.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState icon={CalendarCheck2} title="No events yet" description="Register for an event to see it here." />
            </div>
          ) : (
            <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
              {registrations.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium text-navy">{r.events.title}</p>
                    <p className="text-sm text-navy-500">{formatEventRange(r.events.start_datetime, r.events.end_datetime)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-surface-border bg-white p-5">
          <div className="flex items-center gap-2">
            <Library className="size-5 text-amber-500" aria-hidden />
            <h2 className="text-sm font-semibold text-navy">Content feed</h2>
          </div>
          <p className="mt-1 text-sm text-navy-500">
            Every speaker's shared content across the events you're registered to appears here once you register.
          </p>
        </section>
      </main>
    </>
  );
}