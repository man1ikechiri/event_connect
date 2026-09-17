"use client";

import { LogOut } from "lucide-react";

export function SignOutButton({ name }: { name?: string }) {
  return (
    <form action="/auth/signout" method="post" className="border-t border-white/10 pt-4">
      {name && <p className="mb-2 truncate px-3 text-sm text-navy-100">{name}</p>}
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </button>
    </form>
  );
}
