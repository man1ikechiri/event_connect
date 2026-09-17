import type { Metadata } from "next";
import { LoginForm } from "@/app/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to EventConnect with Google or a one-time email link. No passwords.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-surface-border bg-white p-8 shadow-ambient">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-navy">EventConnect</p>
          <h1 className="mt-3 text-xl font-semibold text-navy">Sign in</h1>
          <p className="mt-1 text-sm text-navy-500">No passwords — use Google or an email link.</p>
        </div>
        <LoginForm next={next} />
        <p className="mt-6 text-center text-xs text-navy-400">
          By continuing you agree to EventConnect's{" "}
          <a href="/terms" className="underline underline-offset-2 hover:text-navy">
            terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline underline-offset-2 hover:text-navy">
            privacy policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
