// src/app/organizer/events/[eventId]/attendees/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { Users, Mail, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuspendButton } from "@/components/shared/suspend-button";
import { formatDate } from "@/lib/utils/dates";
import { InviteAttendeeForm } from "@/app/organizer/events/[eventId]/attendees/invite-attendee-form";
import { fetchOrganizerContacts } from "@/lib/profile-lookup";

export const metadata: Metadata = { title: "Attendees" };

export default async function EventAttendeesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: registrations, error } = await supabase
    .from("event_attendee_registrations")
    .select("id, status, registered_at, organization_affiliation, attendee_user_id")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });

  if (error) console.error("[event attendees] fetch failed:", error.message);

  const contacts = await fetchOrganizerContacts(supabase);

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
          <ul className="divide-y divide-surface-border">
            {registrations.map((reg) => {
              const person = contacts.get(reg.attendee_user_id);
              const displayName = person?.full_name ?? "Registered attendee";
              return (
                <li key={reg.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {person?.avatar_url ? (
                      <Image
                        src={person.avatar_url}
                        alt={`${displayName}'s profile photo`}
                        width={48}
                        height={48}
                        className="size-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy-100 text-base font-semibold text-navy">
                        {displayName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{displayName}</p>
                      {reg.organization_affiliation && (
                        <p className="flex items-center gap-1 truncate text-sm text-navy-500">
                          <Building2 className="size-3" aria-hidden />
                          {reg.organization_affiliation}
                        </p>
                      )}
                      {person?.email && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-navy-400">
                          <Mail className="size-3" aria-hidden />
                          {person.email}
                        </p>
                      )}
                      <p className="text-xs text-navy-400">Registered {formatDate(reg.registered_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={reg.status} />
                    {(reg.status === "accepted" || reg.status === "activated") && (
                      <SuspendButton
                        table="event_attendee_registrations"
                        rowId={reg.id}
                        revalidatePathSlug={`/organizer/events/${eventId}/attendees`}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="h-fit rounded-card border border-surface-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-navy">Register an attendee</h2>
        <InviteAttendeeForm eventId={eventId} />
      </div>
    </div>
  );
}