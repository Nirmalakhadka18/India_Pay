"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  HelpCircle,
  IndianRupee,
  Layers,
  Lock,
  Plus,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ── City Skyline & Sun Illustration for Welcome Hero ──────────────────────────

function CitySkylineIllustration() {
  return (
    <svg
      viewBox="0 0 460 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-80 h-36 sm:w-96 sm:h-44 object-contain pointer-events-none select-none"
    >
      {/* Radiant Sun */}
      <circle cx="360" cy="65" r="32" fill="#FBBF24" fillOpacity="0.9" />
      <circle cx="360" cy="65" r="42" stroke="#FDE68A" strokeWidth="2" strokeDasharray="4 4" />
      {/* Floating Morning Clouds */}
      <path
        d="M210 50 Q225 35 245 42 Q265 30 285 45 Q305 40 310 55 L205 55 Z"
        fill="#FFFFFF"
        fillOpacity="0.75"
      />
      <path
        d="M120 70 Q130 58 148 64 Q162 55 178 66 Q194 62 198 74 L116 74 Z"
        fill="#FFFFFF"
        fillOpacity="0.6"
      />
      {/* Background Silhouetted Skyscrapers */}
      <rect x="250" y="70" width="28" height="85" rx="2" fill="#CBD5E1" fillOpacity="0.6" />
      <rect x="282" y="55" width="34" height="100" rx="2" fill="#94A3B8" fillOpacity="0.5" />
      <rect x="320" y="80" width="24" height="75" rx="2" fill="#CBD5E1" fillOpacity="0.7" />
      <rect x="348" y="60" width="38" height="95" rx="2" fill="#94A3B8" fillOpacity="0.6" />
      <rect x="390" y="75" width="30" height="80" rx="2" fill="#CBD5E1" fillOpacity="0.6" />
      {/* Midground Commercial Towers with Windows */}
      <rect x="180" y="80" width="32" height="75" rx="2" fill="#64748B" fillOpacity="0.7" />
      <line x1="188" y1="90" x2="204" y2="90" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="188" y1="105" x2="204" y2="105" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="188" y1="120" x2="204" y2="120" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="216" y="65" width="30" height="90" rx="2" fill="#475569" fillOpacity="0.8" />
      <line x1="223" y1="78" x2="239" y2="78" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="223" y1="93" x2="239" y2="93" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="223" y1="108" x2="239" y2="108" stroke="#FDE68A" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Foreground Modern Tech Campus Buildings */}
      <rect x="70" y="95" width="45" height="60" rx="3" fill="#3B82F6" fillOpacity="0.85" />
      <rect x="120" y="85" width="55" height="70" rx="3" fill="#2563EB" />
      <line x1="128" y1="98" x2="167" y2="98" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="128" y1="112" x2="167" y2="112" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
      <line x1="128" y1="126" x2="167" y2="126" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="4 4" />
      {/* Overpass & Transportation Bridge Line */}
      <path
        d="M20 155 Q150 145 280 148 Q370 150 440 155"
        stroke="#1E293B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line x1="100" y1="155" x2="100" y2="175" stroke="#475569" strokeWidth="3" />
      <line x1="200" y1="152" x2="200" y2="175" stroke="#475569" strokeWidth="3" />
      <line x1="300" y1="152" x2="300" y2="175" stroke="#475569" strokeWidth="3" />
      {/* Commuter Transit Train on Bridge */}
      <rect x="150" y="142" width="60" height="9" rx="2" fill="#EF4444" />
      <rect x="154" y="144" width="8" height="4" fill="#FFFFFF" />
      <rect x="166" y="144" width="8" height="4" fill="#FFFFFF" />
      <rect x="178" y="144" width="8" height="4" fill="#FFFFFF" />
      <rect x="190" y="144" width="8" height="4" fill="#FFFFFF" />
      {/* Trees & Landscaping */}
      <circle cx="55" cy="155" r="12" fill="#10B981" />
      <circle cx="68" cy="157" r="9" fill="#059669" />
      <circle cx="420" cy="155" r="14" fill="#10B981" />
      <circle cx="435" cy="157" r="10" fill="#059669" />
    </svg>
  );
}

// ── greytHR Pixel-Level Admin Dashboard Component ─────────────────────────────

export function GreytHRAdminDashboard({
  workspaceId,
}: {
  workspaceId: Id<"workspaces">;
}) {
  const [activeTab, setActiveTab] = useState<"welcome" | "dashboard">("welcome");

  // Queries
  const adminData = useQuery(api.dashboard.adminOperations, { workspaceId });
  const employees = useQuery(api.employees.list, { workspaceId });
  const pendingLeaves = adminData?.pendingLeaves ?? [];
  const latestRun = adminData?.activeRun;

  // Active employees count
  const activeCount = employees?.filter((e) => e.status === "active").length ?? 4;

  return (
    <div className="space-y-6">
      {/* ── B. Centered Pill Navigation: Welcome / Dashboard ────────────────────── */}
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setActiveTab("welcome")}
            className={`rounded-full px-6 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "welcome"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Welcome
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`rounded-full px-6 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "dashboard"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
            }`}
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* ── View 1: Welcome Screen (Pixel Replication of greytHR Reference) ─────── */}
      {activeTab === "welcome" ? (
        <div className="space-y-6">
          {/* Top Row: Hero Greeting + Latest Updates Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* C. Welcome Hero Section (Col Span 2) */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-amber-50/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900/80 dark:to-zinc-950">
              <div className="relative z-10 max-w-md">
                <span className="inline-block text-xs font-semibold tracking-wide uppercase text-blue-600 dark:text-blue-400">
                  IndiaPay Enterprise Portal
                </span>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Good Morning
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Welcome to your unified HR & Indian Payroll administrative command center.
                  Track employee attendance, approve leaves, and execute compliant salary runs.
                </p>
              </div>

              {/* City skyline illustration placed on the right */}
              <div className="absolute right-2 bottom-0 hidden sm:block opacity-90">
                <CitySkylineIllustration />
              </div>

              {/* Mobile fallback illustration */}
              <div className="sm:hidden mt-4 flex justify-end">
                <CitySkylineIllustration />
              </div>
            </div>

            {/* E. Latest Updates Section (Col Span 1, Light-Purple Themed Panel) */}
            <div className="rounded-2xl border border-purple-200/80 bg-purple-50/40 p-5 shadow-xs dark:border-purple-950/40 dark:bg-zinc-900 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-purple-100 pb-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Latest Updates
                    </h2>
                  </div>
                  <Link
                    href="/compliance"
                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 transition"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Announcement Cards */}
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-purple-100 bg-white/90 p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      15 Nov 2026 • Statutory Notice
                    </span>
                    <h3 className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      EPFO ECR Text Return Generator Active
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                      New unified member portal format ready for monthly filing with standard ₹15,000 wage ceiling.
                    </p>
                  </div>

                  <div className="rounded-xl border border-purple-100 bg-white/90 p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      12 Nov 2026 • Income Tax Slabs
                    </span>
                    <h3 className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Section 115BAC New Tax Regime Default
                    </h3>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                      Old vs New regime automated comparison now live across all employee salary statements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-purple-100 text-right dark:border-zinc-800">
                <Link
                  href="/compliance"
                  className="text-xs font-semibold text-purple-700 hover:underline dark:text-purple-400"
                >
                  View All Compliance Updates →
                </Link>
              </div>
            </div>
          </div>

          {/* D. My Favourites Section (Translucent Light-Background Container) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                My Favourites
              </h2>
              <span className="text-xs text-slate-400 dark:text-zinc-500">
                Customizable Shortcut Tiles
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Tile 1: Add Favourite Tile */}
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                  );
                }}
                className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center transition hover:border-blue-500 hover:bg-blue-50/30 dark:border-zinc-700 dark:hover:bg-blue-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-400 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-blue-600 dark:text-zinc-300 dark:group-hover:text-blue-400">
                  Add Favourite
                </span>
                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Customize Tiles
                </span>
              </button>

              {/* Tile 2: Add Employee */}
              <Link
                href="/employees"
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-emerald-50/50 p-4 text-center transition hover:border-emerald-500/50 hover:bg-emerald-50 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-emerald-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-950/80 dark:text-emerald-300 transition-colors">
                  <UserPlus className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-800 group-hover:text-emerald-700 dark:text-zinc-200 dark:group-hover:text-emerald-400">
                  Add Employee
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  New Hire Master
                </span>
              </Link>

              {/* Tile 3: Process Payroll */}
              <Link
                href="/payroll"
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-blue-50/50 p-4 text-center transition hover:border-blue-500/50 hover:bg-blue-50 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-blue-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-950/80 dark:text-blue-300 transition-colors">
                  <Banknote className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-800 group-hover:text-blue-700 dark:text-zinc-200 dark:group-hover:text-blue-400">
                  Process Payroll
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Monthly Run
                </span>
              </Link>

              {/* Tile 4: Update Payroll Data */}
              <Link
                href="/salaries"
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-amber-50/50 p-4 text-center transition hover:border-amber-500/50 hover:bg-amber-50 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-amber-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white dark:bg-amber-950/80 dark:text-amber-300 transition-colors">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-800 group-hover:text-amber-700 dark:text-zinc-200 dark:group-hover:text-amber-400">
                  Update Payroll Data
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  CTC & Structures
                </span>
              </Link>

              {/* Tile 5: Salary Statement */}
              <Link
                href="/reports"
                className="group flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-purple-50/50 p-4 text-center transition hover:border-purple-500/50 hover:bg-purple-50 hover:shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-purple-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white dark:bg-purple-950/80 dark:text-purple-300 transition-colors">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <span className="mt-2 text-xs font-semibold text-slate-800 group-hover:text-purple-700 dark:text-zinc-200 dark:group-hover:text-purple-400">
                  Salary Statement
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Registers & MIS
                </span>
              </Link>
            </div>
          </div>

          {/* F. My Tasks Section (greytHR Task Cards with Pending Counters & Monitor Links) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  My Tasks
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                Action Items Pending Review
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Card 1: Leave Requests Task */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Leave Applications
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                      {pendingLeaves.length} pending review
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      Vacation, sick & privilege leave reviews
                    </p>
                  </div>
                </div>
                <Link
                  href="/attendance?tab=leaves"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition shrink-0"
                >
                  Monitor →
                </Link>
              </div>

              {/* Task Card 2: Monthly Payroll Task */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      Payroll Authorization
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                      {latestRun ? `Period: ${latestRun.periodMonth}` : "Ready to execute"}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                      Status:{" "}
                      <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                        {latestRun ? latestRun.status.replace("_", " ") : "NO ACTIVE RUN"}
                      </span>
                    </p>
                  </div>
                </div>
                <Link
                  href="/payroll"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition shrink-0"
                >
                  Monitor →
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── View 2: Dashboard Screen (Analytical & Operations Canvas) ───────────── */
        <div className="space-y-6">
          {/* KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Active Staff
              </span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {activeCount}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Managed in employee directory
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Today&apos;s Swipes
              </span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {adminData?.currentMonthAttendanceCount ?? 1}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                Punches tracked this month
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Pending Leaves
              </span>
              <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {pendingLeaves.length}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                {pendingLeaves.length > 0 ? "Awaiting review" : "All reviewed"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                Payroll Status
              </span>
              <div className="mt-2 text-xl font-bold uppercase text-slate-900 dark:text-white truncate">
                {latestRun ? latestRun.status.replace("_", " ") : "NO RUN"}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                {latestRun?.totalNetSalary
                  ? `₹${latestRun.totalNetSalary.toLocaleString("en-IN")}`
                  : "Ready for monthly cycle"}
              </p>
            </div>
          </div>

          {/* Quick Statutory Reference */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Indian Statutory Deadlines
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  EPFO Electronic Return (ECR)
                </span>
                <p className="mt-1 text-slate-500 dark:text-zinc-400">
                  Due 15th of month • EPF @ 12% with ₹15,000 statutory wage ceiling.
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  Form 138 TDS Challan 281
                </span>
                <p className="mt-1 text-slate-500 dark:text-zinc-400">
                  Due 7th of month • Section 115BAC regime comparison and quarterly returns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
