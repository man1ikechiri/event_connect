// src/app/partner/my-events/page.tsx
import type { Metadata } from "next";
import { HandHeart, MapPin, Video } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatEventRange } from "@/lib/utils/dates";
import { PARTNER_NAV_ITEMS } from "@/lib/nav-items";
import { PartnerRespondButtons } from "@/app/partner/my-events/respond-buttons";
import { PartnerProfileForm } from "@/app/partner/my-events/partner-profile-form";

export const metadata: Metadata = { title: "My events" };

export default async function PartnerMyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invites } = await supabase
    .from("event_partner_invites")
    .select(
      "id, status, org_name, logo_url, contact_email, partner_types:partner_type_id (label), events:event_id (id, title, start_datetime, end_datetime, venue_label, is_virtual)",
    )
    .eq("partner_user_id", user.id)
    .order("invited_at", { ascending: false });

  const mapped = (invites ?? []).map((i: any) => ({
    ...i,
    event: Array.isArray(i.events) ? i.events[0] : i.events,
    partner_type: Array.isArray(i.partner_types) ? i.partner_types[0] : i.partner_types,
  }));

  return (
    <>
      <Topbar title="My events" portalLabel="Partner portal" navItems={PARTNER_NAV_ITEMS} />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          My Events
        </h1>
        {mapped.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={HandHeart} title="No events yet" description="Partner invites from organizers will show up here." />
          </div>
        ) : (
          <ul className="space-y-4">
            {mapped.map((invite) => (
              <li key={invite.id} className="rounded-card border border-surface-border bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-navy">{invite.event.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-500">
                      {invite.event.is_virtual ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                      {formatEventRange(invite.event.start_datetime, invite.event.end_datetime)} · {invite.event.venue_label}
                    </p>
                    <p className="mt-1 text-xs text-navy-400">{invite.partner_type?.label}</p>
                  </div>
                  <StatusBadge status={invite.status} />
                </div>

                {invite.status === "invited" && (
                  <div className="mt-3 border-t border-surface-border pt-3">
                    <PartnerRespondButtons inviteId={invite.id} />
                  </div>
                )}

                {invite.status === "accepted" && (
                  <div className="mt-4 border-t border-surface-border pt-4">
                    <p className="mb-3 text-sm text-navy-500">
                      Complete your partner profile to activate — organization name, logo, and contact email are
                      all required.
                    </p>
                    <PartnerProfileForm
                      inviteId={invite.id}
                      defaults={{
                        org_name: invite.org_name ?? "",
                        logo_url: invite.logo_url ?? "",
                        contact_email: invite.contact_email ?? "",
                      }}
                    />
                  </div>
                )}

                {invite.status === "activated" && (
                  <p className="mt-4 border-t border-surface-border pt-4 text-sm text-state-success">
                    You&apos;re fully activated for this event.
                  </p>
                )}
                {invite.status === "suspended" && (
                  <p className="mt-4 border-t border-surface-border pt-4 text-sm text-state-danger">
                    This role has been suspended by the organizer or an admin. Contact them for details.
                  </p>
                )}
                {invite.status === "declined" && (
                  <p className="mt-4 border-t border-surface-border pt-4 text-sm text-navy-500">
                    You declined this invite.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}