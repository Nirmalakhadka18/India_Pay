"use client";

import { usePathname } from "next/navigation";
import { Grid, HelpCircle, Search } from "lucide-react";
import { useState } from "react";
import { NotificationsBell } from "./notifications-bell";
import { QuickLauncherModal } from "./quick-launcher-modal";

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

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* greytHR-inspired 9-dot quick menu launcher button */}
          <button
            onClick={() => setLauncherOpen(true)}
            title="IndiaPay App Launcher (9-Dots)"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground transition hover:border-blue-500/50 hover:bg-blue-50/50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
          >
            <Grid className="h-4 w-4" />
          </button>

          <nav className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold text-primary/80">IndiaPay</span>
            <span className="text-primary/30">/</span>
            <span className="font-medium text-primary/80">{title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
              );
            }}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/70 transition"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search anything...</span>
            <kbd className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70 border border-border">
              Ctrl K
            </kbd>
          </button>
          <NotificationsBell />
        </div>
      </header>
      <QuickLauncherModal open={launcherOpen} onOpenChange={setLauncherOpen} />
    </>
  );
}

