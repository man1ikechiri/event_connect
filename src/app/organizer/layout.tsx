// src/app/organizer/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/layout/user-context";
import { PortalShell } from "@/components/layout/portal-shell";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/dashboard");

  const [roles, profileRes] = await Promise.all([
    getUserRoles(supabase, user.id),
    supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  // Guard: only approved organizers see this portal. Users who aren't
  // organizers get bounced to /dashboard, which will land them on
  // whichever role they *do* have.
  if (!roles.isOrganizer) redirect("/dashboard");

  const profile = profileRes.data;

  return (
    <UserProvider
      user={{
        id: user.id,
        name: profile?.full_name ?? null,
        email: user.email ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        roles,
      }}
    >
      <PortalShell activeRole="organizer">{children}</PortalShell>
    </UserProvider>
  );
}