"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-zinc-700 hover:text-white hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 cursor-pointer"
      title="Sign out of TaskFlow"
    >
      <LogOut className="h-4 w-4 text-zinc-400" />
      <span>Sign out</span>
    </button>
  );
}
