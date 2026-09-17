import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-items";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/dashboard");

  const { data: profile } = await supabase.from("users").select("is_admin, full_name").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar portalLabel="Admin" items={ADMIN_NAV_ITEMS} footer={<SignOutButton name={profile.full_name} />} />
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
