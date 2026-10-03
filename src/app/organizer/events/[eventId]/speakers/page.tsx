// src/app/organizer/events/[eventId]/speakers/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import { Mic, Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuspendButton } from "@/components/shared/suspend-button";
import { InviteSpeakerForm } from "@/app/organizer/events/[eventId]/speakers/invite-speaker-form";
import { fetchOrganizerContacts } from "@/lib/profile-lookup";

export const metadata: Metadata = { title: "Speakers" };

export default async function EventSpeakersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Plain select — no PostgREST embed to public.users.
  const { data: invites, error } = await supabase
    .from("event_speaker_invites")
    .select("id, session_title, status, invited_at, speaker_user_id")
    .eq("event_id", eventId)
    .order("invited_at", { ascending: false });

  if (error) console.error("[event speakers] fetch failed:", error.message);

  const contacts = await fetchOrganizerContacts(supabase);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-card border border-surface-border bg-white">
        {!invites || invites.length === 0 ? (
          <EmptyState
            icon={Mic}
            title="No speakers invited yet"
            description="Use the form to invite a speaker by email. They must have signed in to EventConnect at least once."
          />
        ) : (
          <ul className="divide-y divide-surface-border">
            {invites.map((invite) => {
              const person = contacts.get(invite.speaker_user_id);
              const displayName = person?.full_name ?? "Invited speaker";
              return (
                <li key={invite.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
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
                      <p className="truncate text-sm text-navy-500">
                        {invite.session_title || "No session title yet"}
                      </p>
                      {person?.email && (
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-navy-400">
                          <Mail className="size-3" aria-hidden />
                          {person.email}
                        </p>
                      )}
                      {person?.phone && (
                        <p className="flex items-center gap-1 truncate text-xs text-navy-400">
                          <Phone className="size-3" aria-hidden />
                          {person.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={invite.status} />
                    {(invite.status === "accepted" || invite.status === "activated") && (
                      <SuspendButton
                        table="event_speaker_invites"
                        rowId={invite.id}
                        revalidatePathSlug={`/organizer/events/${eventId}/speakers`}
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
        <h2 className="mb-4 text-sm font-semibold text-navy">Invite a speaker</h2>
        <InviteSpeakerForm eventId={eventId} />
      </div>
    </div>
  );
}