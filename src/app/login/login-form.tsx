"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ next }: { next?: string }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [sent, setSent] = useState(false);

  const redirectPath = next && next.startsWith("/") ? next : "/dashboard";

  async function handleGoogle() {
    setFormError(undefined);
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    });
    if (error) {
      setFormError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser navigates away to Google, so no further state change here.
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setFormError(undefined);

    if (!EMAIL_RE.test(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError(undefined);
    setMagicLinkLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    });

    setMagicLinkLoading(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-control bg-state-successBg p-5 text-center">
        <MailCheck className="size-6 text-state-success" aria-hidden />
        <p className="text-sm font-medium text-navy">Check your email</p>
        <p className="text-sm text-navy-500">
          We sent a one-time sign-in link to <span className="font-medium">{email}</span>. It expires shortly and
          can only be used once.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        loading={googleLoading}
        onClick={handleGoogle}
        icon={!googleLoading ? <GoogleIcon /> : undefined}
      >
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 text-xs text-navy-400">
        <span className="h-px flex-1 bg-surface-border" />
        or
        <span className="h-px flex-1 bg-surface-border" />
      </div>

      <form onSubmit={handleMagicLink} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={emailError} required>
          <TextInput
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            invalid={Boolean(emailError)}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {formError && (
          <p className="rounded-control bg-state-dangerBg px-3 py-2 text-sm text-state-danger" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" className="w-full" loading={magicLinkLoading}>
          Send magic link
        </Button>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.59-5.15 3.59-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.86-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l3.99-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
