import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils/dates";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";
import { ResolveFlagActions } from "@/app/admin/moderation/resolve-flag-actions";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminModerationPage() {
  const supabase = await createClient();
  const { data: flags } = await supabase
    .from("moderation_flags")
    .select("id, target_type, reason, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return (
    <>
      <Topbar title="Moderation" portalLabel="Admin" navItems={ADMIN_NAV_ITEMS} />
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        {!flags || flags.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={ShieldAlert} title="Queue is clear" description="No open moderation flags right now." />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
            {flags.map((flag) => (
              <li key={flag.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-navy-400">{flag.target_type} · {relativeTime(flag.created_at)}</p>
                  <p className="mt-1 text-sm text-navy">{flag.reason}</p>
                </div>
                <ResolveFlagActions flagId={flag.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
