import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Events" };

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, status, start_datetime, end_datetime, organizer:organizer_id (full_name, email)")
    .order("start_datetime", { ascending: false })
    .limit(100);

  return (
    <>
      <Topbar title="Events" portalLabel="Admin" navItems={ADMIN_NAV_ITEMS} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Organizer</th>
                <th className="px-5 py-3">Dates</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(events ?? []).map((e: any) => {
                const organizer = Array.isArray(e.organizer) ? e.organizer[0] : e.organizer;
                return (
                  <tr key={e.id}>
                    <td className="px-5 py-3 font-medium text-navy">{e.title}</td>
                    <td className="px-5 py-3 text-navy-500">{organizer?.full_name || organizer?.email}</td>
                    <td className="px-5 py-3 text-navy-500">{formatEventRange(e.start_datetime, e.end_datetime)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={e.status} kind="event" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
