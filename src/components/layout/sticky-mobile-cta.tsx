import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function StickyMobileCta({ href, label }: { href: string; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-white p-3 shadow-ambient-hover md:hidden">
      <Link
        href={href}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-amber text-sm font-semibold text-white"
      >
        {label}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
