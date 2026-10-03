import type { Metadata } from "next";
import { Users, CalendarDays, ShieldAlert, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: userCount }, { count: eventCount }, { count: openFlags }, { count: pendingOrganizers }] =
    await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("moderation_flags").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("organizer_status", "pending"),
    ]);

  const stats = [
    { label: "Total users", value: userCount ?? 0, icon: Users },
    { label: "Total events", value: eventCount ?? 0, icon: CalendarDays },
    { label: "Open moderation flags", value: openFlags ?? 0, icon: ShieldAlert },
    { label: "Pending organizer approvals", value: pendingOrganizers ?? 0, icon: Clock },
  ];

  return (
    <>
      <Topbar title="Dashboard" portalLabel="Admin" navItems={[]} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-card border border-surface-border bg-white p-5">
              <stat.icon className="size-5 text-amber-500" aria-hidden />
              <p className="mt-3 text-2xl font-semibold text-navy">{stat.value}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-navy-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
