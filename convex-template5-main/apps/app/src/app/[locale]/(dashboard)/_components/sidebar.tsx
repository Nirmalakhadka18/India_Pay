"use client";

import {
  cleanClientSessionStorage,
  performLogout,
  setupBfcacheLogoutProtection,
} from "@/lib/logout";
import { useWorkspace } from "@/lib/useWorkspace";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Logo } from "@v1/ui/logo";
import { useQuery } from "convex/react";
import {
  Banknote,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GitFork,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  UserCircle,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

const ALL_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/engage",
    label: "Engage",
    icon: Sparkles,
  },
  {
    href: "/my-portal",
    label: "My Portal",
    icon: UserCircle,
    memberOnly: true,
  },
  { href: "/employees", label: "Employees", icon: Users, hrOnly: true },
  { href: "/payroll", label: "Payroll", icon: Banknote, hrOnly: true },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck, hrOnly: true },
  { href: "/reports", label: "Reports", icon: FileText, hrOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, hrOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.getUser);
  const { workspaces, current, select, isLoading: wsLoading } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    return setupBfcacheLogoutProtection();
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);
    try {
      await performLogout({
        signOut,
        timeoutMs: 3500,
        redirectTo: "/login",
        onError: () => {
          setLogoutError("Sign out error, redirecting...");
        },
        onTimeout: () => {
          setLogoutError("Sign out timed out, redirecting...");
        },
      });
    } catch {
      cleanClientSessionStorage();
      if (typeof window !== "undefined") {
        window.location.replace("/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleForceLogout = () => {
    cleanClientSessionStorage();
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  const currentRole = workspaces.find((w) => w._id === current)?.role;
  const isHR = currentRole === "owner" || currentRole === "admin";
  const myProfile = useQuery(
    api.employees.getMyProfile,
    current ? { workspaceId: current } : "skip",
  );

  const NAV = useMemo(() => {
    if (isHR) {
      return [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/engage", label: "Engage", icon: Sparkles },
        { href: "/employees", label: "Employees", icon: Users },
        { href: "/payroll", label: "Payroll", icon: Banknote },
        { href: "/compliance", label: "Compliance", icon: ShieldCheck },
        { href: "/reports", label: "Reports", icon: FileText },
        { href: "/settings", label: "Settings", icon: Settings },
      ];
    }
    return [
      { href: "/", label: "Home", icon: Home },
      { href: "/engage", label: "Engage", icon: Sparkles },
      { href: "/worklife", label: "My Worklife", icon: Briefcase },
      { href: "/todo", label: "To Do", icon: ClipboardCheck },
      { href: "/salary", label: "Salary", icon: Wallet },
      { href: "/leave", label: "Leave", icon: CalendarDays },
      { href: "/people", label: "People", icon: Users },
      { href: "/documents", label: "Document Center", icon: FileText },
      { href: "/helpdesk", label: "Helpdesk", icon: HelpCircle },
      { href: "/delegates", label: "Workflow Delegates", icon: GitFork },
    ];
  }, [isHR]);

  const Body = (
    <div className="flex h-full w-60 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Logo width={26} height={26} />
      </div>

      <div className="p-3 pb-2">
        <span className="mb-1 block text-[10px] uppercase tracking-wide text-primary/40">
          Workspace
        </span>
        <select
          value={current ?? ""}
          onChange={(e) => select(e.target.value as Id<"workspaces">)}
          className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          disabled={workspaces.length === 0}
        >
          {workspaces.length === 0 && (
            <option value="">
              {wsLoading ? "Loading workspaces…" : "No workspace available"}
            </option>
          )}
          {workspaces.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name} ({w.role})
            </option>
          ))}
        </select>
      </div>

      {/* Member Profile Card from Screenshots ("Hi Javeria - View My Info") */}
      {!isHR && (
        <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-lg border border-border/80 bg-muted/40 p-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-primary">
              Hi {myProfile?.firstName || user?.name || "Member"}
            </p>
            <Link
              href="/worklife"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              View My Info
            </Link>
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active
                  ? "bg-primary/10 font-semibold text-primary"
                  : "text-primary/70 hover:bg-primary/5 hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center gap-2">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-lime-400 via-cyan-300 to-blue-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-primary/80">
              {user?.name || "—"}
            </p>
            <p className="truncate text-xs text-primary/50">{user?.email}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {logoutError && (
            <div className="flex items-center justify-between gap-1 rounded bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
              <span>{logoutError}</span>
              <button
                type="button"
                onClick={handleForceLogout}
                className="underline font-medium hover:text-destructive/80"
              >
                Force
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <ThemeSwitcher />
            <button
              type="button"
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-primary/60 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
            >
              <LogOut
                className={`h-4 w-4 ${isLoggingOut ? "animate-spin" : ""}`}
              />
              {isLoggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <Logo width={22} height={22} />
      </div>

      <aside className="sticky top-0 hidden h-screen shrink-0 md:block">
        {Body}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 cursor-default bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute -right-9 top-3 text-white"
              onClick={() => setOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            {Body}
          </div>
        </div>
      )}
    </>
  );
}
