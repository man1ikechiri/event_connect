// src/app/partner/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { PARTNER_NAV_ITEMS } from "@/lib/nav-items";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/partner/dashboard");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).single(),
    supabase.from("event_partner_invites").select("id", { count: "exact", head: true }).eq("partner_user_id", user.id),
  ]);

  if (!count) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar portalLabel="Partner portal" items={PARTNER_NAV_ITEMS} footer={<SignOutButton name={profile?.full_name} />} />
      <div className="md:pl-64">{children}</div>
    </div>
  );
}