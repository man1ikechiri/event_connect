import Link from "next/link";
import type { Metadata } from "next";
import { CircleCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Your action was completed successfully.",
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string; nextLabel?: string }>;
}) {
  const params = await searchParams;
  const message = params.message ?? "You're all set.";
  const next = params.next ?? "/";
  const nextLabel = params.nextLabel ?? "Back to EventConnect";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-muted px-6 text-center">
      <CircleCheck className="size-12 text-state-success" strokeWidth={1.5} aria-hidden />
      <h1 className="text-2xl font-semibold text-navy">Thank you</h1>
      <p className="max-w-sm text-navy-500">{message}</p>
      <Link
        href={next}
        className="mt-2 inline-flex h-11 items-center rounded-control bg-amber px-5 text-sm font-semibold text-white hover:bg-amber-500"
      >
        {nextLabel}
      </Link>
    </div>
  );
}
