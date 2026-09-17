import type { Metadata } from "next";
import Image from "next/image";
import { Mic, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuspendButton } from "@/components/shared/suspend-button";
import { InviteSpeakerForm } from "@/app/organizer/events/[eventId]/speakers/invite-speaker-form";

export const metadata: Metadata = { title: "Speakers" };

export default async function EventSpeakersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const { data: invites } = await supabase
    .from("event_speaker_invites")
    .select(
      "id, session_title, status, invited_at, speaker_user_id, users:speaker_user_id (full_name, email, avatar_url)",
    )
    .eq("event_id", eventId)
    .order("invited_at", { ascending: false });

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
              const speaker = Array.isArray(invite.users) ? invite.users[0] : invite.users;
              return (
                <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {speaker?.avatar_url ? (
                      <Image
                        src={speaker.avatar_url}
                        alt={`${speaker.full_name}'s profile photo`}
                        width={40}
                        height={40}
                        className="size-10 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy">
                        {(speaker?.full_name || speaker?.email || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy">{speaker?.full_name || speaker?.email}</p>
                      <p className="truncate text-sm text-navy-500">
                        {invite.session_title || "No session title yet"}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-navy-400">
                        <Mail className="size-3" aria-hidden />
                        {speaker?.email}
                      </p>
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
