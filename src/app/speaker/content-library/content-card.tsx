"use client";

import { useTransition } from "react";
import { Globe, PlayCircle, FileText, Presentation, Share2, Trash2, ExternalLink } from "lucide-react";
import { deleteContentItem } from "@/app/speaker/actions";

const ICONS: Record<string, typeof Globe> = {
  website_url: Globe,
  video_url: PlayCircle,
  social_media_url: Share2,
  pdf_url: FileText,
  google_doc_url: FileText,
  presentation: Presentation,
};

export function ContentCard({
  item,
}: {
  item: { id: string; title: string; url: string; preview_status: string; type_slug: string; type_label: string };
}) {
  const [pending, startTransition] = useTransition();
  const Icon = ICONS[item.type_slug] ?? Globe;

  return (
    <div className="group relative flex flex-col gap-3 rounded-card border border-surface-border bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="flex size-10 items-center justify-center rounded-control bg-navy-50 text-navy">
          <Icon className="size-5" aria-hidden />
        </div>
        <button
          type="button"
          aria-label={`Remove ${item.title} from content library`}
          disabled={pending}
          onClick={() => startTransition(() => deleteContentItem(item.id))}
          className="rounded-control p-1.5 text-navy-300 opacity-0 transition-opacity hover:bg-state-dangerBg hover:text-state-danger group-hover:opacity-100"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      <div className="min-w-0">
        <p className="truncate font-medium text-navy">{item.title}</p>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex items-center gap-1 truncate text-sm text-navy-400 hover:text-navy"
        >
          <ExternalLink className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{item.url}</span>
        </a>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-surface-border pt-3 text-xs">
        <span className="rounded-full bg-surface-muted px-2 py-1 text-navy-500">{item.type_label}</span>
        <span className="text-navy-400">{item.preview_status === "pending" ? "Preview processing…" : "Ready"}</span>
      </div>
    </div>
  );
}
