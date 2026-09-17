import type { Metadata } from "next";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuspendButton } from "@/components/shared/suspend-button";
import { formatDate } from "@/lib/utils/dates";
import { InviteAttendeeForm } from "@/app/organizer/events/[eventId]/attendees/invite-attendee-form";

export const metadata: Metadata = { title: "Attendees" };

export default async function EventAttendeesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: registrations } = await supabase
    .from("event_attendee_registrations")
    .select(
      "id, status, registered_at, organization_affiliation, users:attendee_user_id (full_name, email)",
    )
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-card border border-surface-border bg-white">
        {!registrations || registrations.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No attendees yet"
            description="Registrations — whether self-signed-up or organizer-invited — will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-surface-border text-xs font-semibold uppercase tracking-wide text-navy-400">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Organization</th>
                  <th className="px-5 py-3">Registered</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {registrations.map((reg) => {
                  const attendee = Array.isArray(reg.users) ? reg.users[0] : reg.users;
                  return (
                    <tr key={reg.id}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-navy">{attendee?.full_name || attendee?.email}</p>
                        <p className="text-xs text-navy-400">{attendee?.email}</p>
                      </td>
                      <td className="px-5 py-3 text-navy-500">{reg.organization_affiliation || "—"}</td>
                      <td className="px-5 py-3 text-navy-500">{formatDate(reg.registered_at)}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={reg.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        {(reg.status === "accepted" || reg.status === "activated") && (
                          <SuspendButton
                            table="event_attendee_registrations"
                            rowId={reg.id}
                            revalidatePathSlug={`/organizer/events/${eventId}/attendees`}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="h-fit rounded-card border border-surface-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-navy">Register an attendee</h2>
        <InviteAttendeeForm eventId={eventId} />
      </div>
    </div>
  );
}
