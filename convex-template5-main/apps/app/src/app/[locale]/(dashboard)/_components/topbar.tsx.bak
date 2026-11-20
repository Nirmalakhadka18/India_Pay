"use client";

import { usePathname } from "next/navigation";
import {
  Bell,
  Grid,
  HelpCircle,
  LogOut,
  Power,
  Search,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";
import { NotificationsBell } from "./notifications-bell";
import { QuickLauncherModal } from "./quick-launcher-modal";
import { useWorkspace } from "@/lib/useWorkspace";
import { useAuthActions } from "@convex-dev/auth/react";
import { cleanClientSessionStorage, performLogout } from "@/lib/logout";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

const TITLES: Record<string, string> = {
  "/": "Home",
  "/engage": "Engage",
  "/worklife": "My Worklife",
  "/todo": "To Do",
  "/salary": "Salary",
  "/leave": "Leave Apply",
  "/leave/apply": "Leave Apply",
  "/leave/balances": "Leave Balances",
  "/leave/calendar": "Leave Calendar",
  "/leave/holiday-calendar": "Holiday Calendar",
  "/documents": "Document Center",
  "/people": "People",
  "/helpdesk": "Helpdesk",
  "/delegates": "Workflow Delegates",
  "/my-portal": "My Info",
  "/employees": "Employees",
  "/salaries": "Salaries",
  "/payroll": "Payroll",
  "/attendance": "Attendance",
  "/compliance": "Compliance",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Home";
  const [launcherOpen, setLauncherOpen] = useState(false);
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getUser);

  const handleLogout = async () => {
    try {
      await performLogout({
        signOut,
        timeoutMs: 3500,
        redirectTo: "/login",
      });
    } catch {
      cleanClientSessionStorage();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    }
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
        {/* Left Side: 9-Dot Launcher + Brand Logo */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setLauncherOpen(true)}
            title="App Launcher (9-Dots)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-blue-500/50 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            <Grid className="h-4 w-4" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <img
              src="/victor-chasex-logo.jpg"
              alt="VICTOR CHASEX"
              className="h-7 w-auto object-contain rounded"
              style={{ aspectRatio: "661 / 211" }}
            />
          </Link>
        </div>

        {/* Right Side: Global Search, AI Assistant, Notifications, Settings & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Global Search Bar */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
              );
            }}
            className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search actions, employees...</span>
            <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Ctrl K
            </kbd>
          </button>

          {/* AI Assistant Icon */}
          <Link
            href="/#assistant"
            title="AI Payroll Assistant"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
          </Link>

          {/* Notifications Bell */}
          <NotificationsBell />

          {/* Settings Shortcut */}
          <Link
            href="/settings"
            title="System Settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 hover:bg-slate-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition"
          >
            <Settings className="h-4 w-4" />
          </Link>

          {/* Power / Logout Control */}
          <button
            onClick={handleLogout}
            title="Sign out of IndiaPay"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition"
          >
            <Power className="h-4 w-4" />
          </button>
        </div>
      </header>
      <QuickLauncherModal open={launcherOpen} onOpenChange={setLauncherOpen} />
    </>
  );
}

