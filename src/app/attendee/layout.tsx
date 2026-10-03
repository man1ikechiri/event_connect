// src/app/attendee/layout.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/layout/user-context";
import { ATTENDEE_NAV_ITEMS } from "@/lib/nav-items";

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

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

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