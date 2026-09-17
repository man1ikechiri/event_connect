import type { Metadata } from "next";
import { Library } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/topbar";
import { EmptyState } from "@/components/ui/empty-state";
import { SPEAKER_NAV_ITEMS } from "@/lib/nav-items";
import { ContentCard } from "@/app/speaker/content-library/content-card";
import { AddContentForm } from "@/app/speaker/content-library/add-content-form";

export const metadata: Metadata = { title: "Content library" };

export default async function ContentLibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: items }, { data: contentTypes }] = await Promise.all([
    supabase
      .from("content_library_items")
      .select("id, title, url, preview_status, content_types:content_type_id (slug, label)")
      .eq("speaker_id", user.id)
      .order("added_at", { ascending: false }),
    supabase.from("content_types").select("id, label").order("sort_order"),
  ]);

  return (
    <>
      <Topbar title="Content library" portalLabel="Speaker portal" navItems={SPEAKER_NAV_ITEMS} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <p className="mb-6 max-w-2xl text-sm text-navy-500">
          Links only for now — website, video, social, PDF, Google Doc, or presentation links. Attendees registered
          to your events can see everything here.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {!items || items.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState icon={Library} title="Your library is empty" description="Add your first link to get started — it also activates your speaker invites." />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item: any) => {
                const type = Array.isArray(item.content_types) ? item.content_types[0] : item.content_types;
                return (
                  <ContentCard
                    key={item.id}
                    item={{
                      id: item.id,
                      title: item.title,
                      url: item.url,
                      preview_status: item.preview_status,
                      type_slug: type?.slug ?? "website_url",
                      type_label: type?.label ?? "Link",
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="h-fit rounded-card border border-surface-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-navy">Add content</h2>
            <AddContentForm contentTypes={contentTypes ?? []} />
          </div>
        </div>
      </main>
    </>
  );
}
