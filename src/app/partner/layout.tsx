// src/app/partner/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/layout/user-context";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/partner/dashboard");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("event_partner_invites")
      .select("id", { count: "exact", head: true })
      .eq("partner_user_id", user.id),
  ]);

  if (!count) redirect("/onboarding");

  return (
    <UserProvider
      user={{
        id: user.id,
        name: profile?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      }}
    >
      <div className="min-h-screen bg-surface-muted">{children}</div>
    </UserProvider>
  );
}