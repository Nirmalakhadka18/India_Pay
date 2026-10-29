"use client";

import { usePathname } from "next/navigation";
import { NotificationsBell } from "./notifications-bell";

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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="text-primary/40">myos</span>
        <span className="text-primary/30">/</span>
        <span className="font-medium text-primary/80">{title}</span>
      </nav>
      <div className="flex items-center gap-3">
        <NotificationsBell />
      </div>
    </header>
  );
}

