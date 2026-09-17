import Link from "next/link";
import type { Metadata } from "next";
import { Compass, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you're looking for doesn't exist or may have moved.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-muted px-6 text-center">
      <Compass className="size-10 text-navy-300" strokeWidth={1.5} aria-hidden />
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">404</p>
      <h1 className="text-2xl font-semibold text-navy">We can't find that page</h1>
      <p className="max-w-sm text-navy-500">
        The link may be out of date, or the event, invite, or profile it pointed to may have been removed.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center gap-2 rounded-control bg-amber px-5 text-sm font-semibold text-white hover:bg-amber-500"
      >
        Back to EventConnect
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}
