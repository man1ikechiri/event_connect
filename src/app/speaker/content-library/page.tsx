// src/app/speaker/content-library/page.tsx
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

  const [{ data: invites }, { data: items }, { data: contentTypes }] = await Promise.all([
    supabase
      .from("event_speaker_invites")
      .select("event_id, events:event_id (id, title)")
      .eq("speaker_user_id", user.id)
      .in("status", ["accepted", "activated"]),
    supabase
      .from("content_library_items")
      .select(
        "id, title, url, preview_status, event_id, content_types:content_type_id (slug, label), events:event_id (title)",
      )
      .eq("speaker_id", user.id)
      .order("added_at", { ascending: false }),
    supabase.from("content_types").select("id, label").order("sort_order"),
  ]);

  const events = (invites ?? [])
    .map((i: any) => (Array.isArray(i.events) ? i.events[0] : i.events))
    .filter(Boolean);

  return (
    <>
      <Topbar title="Content library" portalLabel="Speaker portal" navItems={SPEAKER_NAV_ITEMS} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">
          Content Library
        </h1>
        <p className="mb-6 max-w-2xl text-sm text-navy-500">
          Every item you add is tied to one specific event — you&apos;re only activated for an event once you&apos;ve
          added at least one piece of content for it, on top of completing your profile.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {!items || items.length === 0 ? (
            <div className="rounded-card border border-dashed border-surface-border bg-white">
              <EmptyState
                icon={Library}
                title="Your library is empty"
                description="Add your first link, picking the event it's for, to activate that invite."
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item: any) => {
                const type = Array.isArray(item.content_types) ? item.content_types[0] : item.content_types;
                const event = Array.isArray(item.events) ? item.events[0] : item.events;
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
                      event_title: event?.title ?? "",
                    }}
                  />
                );
              })}
            </div>
          )}

          <div className="h-fit rounded-card border border-surface-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-navy">Add content</h2>
            <AddContentForm contentTypes={contentTypes ?? []} events={events} />
          </div>
        </div>
      </main>
    </>
  );
}