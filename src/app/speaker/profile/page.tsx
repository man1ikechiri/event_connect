import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SpeakerProfileForm } from "@/app/speaker/profile/speaker-profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function SpeakerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: userRow }, { data: speakerProfile }] = await Promise.all([
    supabase.from("users").select("full_name, email, phone").eq("id", user.id).single(),
    supabase
      .from("speaker_profiles")
      .select("professional_title, company, linkedin_url, personal_website_url")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          My Profile
        </h1>
        <div className="rounded-card border border-surface-border bg-white p-6">
          <SpeakerProfileForm
            defaults={{
              full_name: userRow?.full_name ?? "",
              email: userRow?.email ?? "",
              phone: userRow?.phone ?? "",
              professional_title: speakerProfile?.professional_title ?? "",
              company: speakerProfile?.company ?? "",
              linkedin_url: speakerProfile?.linkedin_url ?? "",
              personal_website_url: speakerProfile?.personal_website_url ?? "",
            }}
          />
        </div>
      </main>
    </>
  );
}
