// src/components/layout/hero-banner.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function HeroBanner({
  src,
  heightClass = "aspect-[4/1] max-h-[420px]",
}: {
  src: string;
  heightClass?: string;
}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(Math.min(window.scrollY * 0.28, 90));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      aria-label="OurEvents.rsvp banner"
      className={cn(
        "relative w-full overflow-hidden bg-navy",
        heightClass,
      )}
    >
      {/* Image: Ken Burns + parallax */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${offset}px)` }}
      >
        <Image
          src={src}
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          className="hero-ken-burns object-cover object-center"
        />
      </div>

      {/* Bottom fade so the wave blends cleanly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy/60 to-transparent"
      />

      {/* Light-leak blob 1 — amber, drifting from bottom-left */}
      <div
        aria-hidden
        className="hero-blob-1 pointer-events-none absolute -bottom-20 -left-20 size-80 rounded-full bg-amber/40 blur-3xl mix-blend-screen"
      />

      {/* Light-leak blob 2 — cool sky tone, drifting from top-right */}
      <div
        aria-hidden
        className="hero-blob-2 pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-sky-300/25 blur-3xl mix-blend-screen"
      />

      {/* Organic wave bottom edge — uses currentColor to inherit Tailwind token */}
      <svg
        aria-hidden
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full text-surface-muted md:h-14"
      >
        <path
          d="M0,50 C200,90 380,10 620,40 C860,70 1080,20 1260,45 C1350,57 1400,55 1440,48 L1440,90 L0,90 Z"
          fill="currentColor"
        />
      </svg>
    </section>
  );
}