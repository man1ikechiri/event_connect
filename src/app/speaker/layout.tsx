import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/layout/user-context";
import { PortalShell } from "@/components/layout/portal-shell";
import { getUserRoles } from "@/lib/auth/get-user-roles";

export default async function SpeakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/speaker/dashboard");

  const [roles, profileRes] = await Promise.all([
    getUserRoles(supabase, user.id),
    supabase
      .from("users")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  // getUserRoles already returns isSpeaker=false when the user has no
  // accepted/activated speaker invites, so this one check covers both
  // "never been invited" and "invited but hasn't accepted yet."
  // Decision A: non-speakers land on /dashboard (role picker).
  if (!roles.isSpeaker) redirect("/dashboard");

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
      <PortalShell activeRole="speaker">{children}</PortalShell>
    </UserProvider>
  );
}