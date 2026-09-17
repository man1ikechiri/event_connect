import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { ORGANIZER_NAV_ITEMS } from "@/lib/nav-items";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/organizer/dashboard");

  const { data: profile } = await supabase
    .from("users")
    .select("organizer_status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.organizer_status !== "approved") {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Sidebar
        portalLabel="Organizer portal"
        items={ORGANIZER_NAV_ITEMS}
        footer={<SignOutButton name={profile.full_name} />}
      />
      <div className="md:pl-64">{children}</div>
    </div>
  );
}
