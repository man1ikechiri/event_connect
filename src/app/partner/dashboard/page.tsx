// src/app/partner/dashboard/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Users, UserCheck, Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { HeroBanner } from "@/components/layout/hero-banner";

export const metadata: Metadata = { title: "Dashboard" };

export default async function PartnerDashboardPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) {
  const { event: eventParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: partnerEvents } = await supabase
    .from("event_partner_invites")
    .select("events:event_id (id, title)")
    .eq("partner_user_id", user.id);

  const events = (partnerEvents ?? []).map((p: any) => (Array.isArray(p.events) ? p.events[0] : p.events)).filter(Boolean);

  if (events.length === 0) {
    return (
      <>
        <HeroBanner src="/images/hero-banner.png" />
        <main className="mx-auto max-w-3xl px-4 py-8 md:px-8">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
            Hello! Welcome Back...
          </h1>
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={Users} title="No events yet" description="Once an organizer invites you as a partner, it shows up here." />
          </div>
        </main>
      </>
    );
  }

  const activeEvent = events.find((e: any) => e.id === eventParam) ?? events[0];

  // Aggregate-only, via the SECURITY DEFINER RPC — no attendee rows ever
  // reach this client (Section 9 / 14).
  const { data: stats } = await supabase.rpc("partner_event_stats", { p_event_id: activeEvent.id }).single();

  const { data: speakers } = await supabase
    .from("event_speaker_invites")
    .select("session_title, users:speaker_user_id (full_name)")
    .eq("event_id", activeEvent.id)
    .in("status", ["accepted", "activated"]);

  return (
    <>
      <Topbar title="Dashboard" portalLabel="Partner portal" navItems={PARTNER_NAV_ITEMS} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
        <div className="flex flex-wrap gap-2">
          {events.map((e: any) => (
            <Link
              key={e.id}
              href={`/partner/dashboard?event=${e.id}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                e.id === activeEvent.id ? "border-navy bg-navy text-white" : "border-surface-border text-navy-500 hover:border-navy"
              }`}
            >
              {e.title}
            </Link>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-card border border-surface-border bg-white p-5">
            <Users className="size-5 text-amber-500" aria-hidden />
            <p className="mt-3 text-2xl font-semibold text-navy">{stats?.invited_count ?? 0}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Invited attendees</p>
          </div>
          <div className="rounded-card border border-surface-border bg-white p-5">
            <UserCheck className="size-5 text-amber-500" aria-hidden />
            <p className="mt-3 text-2xl font-semibold text-navy">{stats?.confirmed_count ?? 0}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Confirmed attendees</p>
          </div>
        </div>

        <div className="rounded-card border border-surface-border bg-white">
          <div className="flex items-center gap-2 border-b border-surface-border px-5 py-3">
            <Mic className="size-4 text-navy-400" aria-hidden />
            <h2 className="text-sm font-semibold text-navy">Speaker lineup</h2>
          </div>
          {!speakers || speakers.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-navy-400">No confirmed speakers yet.</p>
          ) : (
            <ul className="divide-y divide-surface-border">
              {speakers.map((s: any, i: number) => {
                const speaker = Array.isArray(s.users) ? s.users[0] : s.users;
                return (
                  <li key={i} className="px-5 py-3">
                    <p className="font-medium text-navy">{speaker?.full_name}</p>
                    <p className="text-sm text-navy-500">{s.session_title || "Session title TBA"}</p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}