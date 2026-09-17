import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { SPEAKER_NAV_ITEMS } from "@/lib/nav-items";

export default async function SpeakerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/speaker/dashboard");

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).single(),
    supabase
      .from("event_speaker_invites")
      .select("id", { count: "exact", head: true })
      .eq("speaker_user_id", user.id),
  ]);

  if (!count) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar
        portalLabel="Speaker portal"
        items={SPEAKER_NAV_ITEMS}
        footer={<SignOutButton name={profile?.full_name} />}
      />
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
