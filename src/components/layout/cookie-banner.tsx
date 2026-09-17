"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "ec_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(CONSENT_KEY));
  }, []);

  function decide(value: "accepted" | "declined") {
    localStorage.setItem(CONSENT_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-border bg-white p-4 shadow-ambient-hover md:p-5"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Cookie className="mt-0.5 size-5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-sm text-navy-500">
            We use essential cookies to keep you signed in, and optional analytics cookies to improve
            EventConnect. Read our{" "}
            <Link href="/privacy" className="font-medium text-navy underline underline-offset-2">
              privacy policy
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 gap-2 self-end md:self-auto">
          <Button variant="secondary" size="sm" onClick={() => decide("declined")}>
            Decline optional
          </Button>
          <Button size="sm" onClick={() => decide("accepted")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
