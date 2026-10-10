import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/layout/user-context";
import { PortalShell } from "@/components/layout/portal-shell";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export default async function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/attendee/dashboard");

  const [roles, profileRes] = await Promise.all([
    getUserRoles(supabase, user.id),
    supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  // isAttendee is always true for signed-in users, so this guard is a
  // formality — kept for symmetry and future-proofing if that rule changes.
  if (!roles.isAttendee) redirect("/dashboard");

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
      <PortalShell activeRole="attendee">{children}</PortalShell>
    </UserProvider>
  );
}