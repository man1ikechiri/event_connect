import type { Metadata } from "next";
import { History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/utils/dates";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";

export const metadata: Metadata = { title: "Audit log" };

export default async function AdminAuditLogPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("audit_log")
    .select("id, action_type, target_type, target_id, created_at, actor:actor_user_id (full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.ilike("action_type", `%${q}%`);
  }

  const { data: entries } = await query;

  return (
    <>
      <Topbar title="Audit log" portalLabel="Admin" navItems={ADMIN_NAV_ITEMS} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <form className="mb-4">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by action type…"
            className="h-10 w-full max-w-sm rounded-control border border-surface-border bg-white px-3 text-sm text-navy focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
          />
        </form>

        {!entries || entries.length === 0 ? (
          <div className="rounded-card border border-dashed border-surface-border bg-white">
            <EmptyState icon={History} title="No entries" description="Actions across the platform will be recorded here." />
          </div>
        ) : (
          <ul className="divide-y divide-surface-border overflow-hidden rounded-card border border-surface-border bg-white">
            {entries.map((entry: any) => {
              const actor = Array.isArray(entry.actor) ? entry.actor[0] : entry.actor;
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium text-navy">{entry.action_type.replaceAll("_", " ")}</p>
                    <p className="text-xs text-navy-400">
                      {actor?.full_name || actor?.email || "System"} · {entry.target_type}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-navy-400">{relativeTime(entry.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
