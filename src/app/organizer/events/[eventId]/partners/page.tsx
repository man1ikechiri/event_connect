import type { Metadata } from "next";
import { HandHeart, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SuspendButton } from "@/components/shared/suspend-button";
import { InvitePartnerForm } from "@/app/organizer/events/[eventId]/partners/invite-partner-form";

export const metadata: Metadata = { title: "Partners" };

export default async function EventPartnersPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const supabase = await createClient();
  const [{ data: invites }, { data: partnerTypes }] = await Promise.all([
    supabase
      .from("event_partner_invites")
      .select(
        "id, org_name, status, invited_at, logo_url, partner_types:partner_type_id (label), users:partner_user_id (full_name, email)",
      )
      .eq("event_id", eventId)
      .order("invited_at", { ascending: false }),
    supabase.from("partner_types").select("id, label").order("sort_order"),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-card border border-surface-border bg-white">
        {!invites || invites.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title="No partners invited yet"
            description="Sponsors, vendors, volunteers, media, and hospitality contacts all start here."
          />
        ) : (
          <ul className="divide-y divide-surface-border">
            {invites.map((invite) => {
              const partner = Array.isArray(invite.users) ? invite.users[0] : invite.users;
              const type = Array.isArray(invite.partner_types) ? invite.partner_types[0] : invite.partner_types;
              return (
                <li key={invite.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{invite.org_name || partner?.full_name || partner?.email}</p>
                    <p className="text-sm text-navy-500">{type?.label}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-navy-400">
                      <Mail className="size-3" aria-hidden />
                      {partner?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={invite.status} />
                    {(invite.status === "accepted" || invite.status === "activated") && (
                      <SuspendButton
                        table="event_partner_invites"
                        rowId={invite.id}
                        revalidatePathSlug={`/organizer/events/${eventId}/partners`}
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
        <h2 className="mb-4 text-sm font-semibold text-navy">Invite a partner</h2>
        <InvitePartnerForm eventId={eventId} partnerTypes={partnerTypes ?? []} />
      </div>
    </div>
  );
}
