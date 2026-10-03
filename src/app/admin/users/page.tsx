import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { StatusBadge } from "@/components/ui/status-badge";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";
import { UserRowActions } from "@/app/admin/users/user-row-actions";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, is_admin, organizer_status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <Topbar title="Users" portalLabel="Admin" navItems={[]} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="overflow-hidden rounded-card border border-surface-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-surface-border text-xs font-semibold uppercase tracking-wide text-navy-400">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Organizer status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {(users ?? []).map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-navy">{u.full_name || u.email}</p>
                    <p className="text-xs text-navy-400">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={u.organizer_status} />
                  </td>
                  <td className="px-5 py-3">
                    {!u.is_admin && <UserRowActions userId={u.id} organizerStatus={u.organizer_status} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
