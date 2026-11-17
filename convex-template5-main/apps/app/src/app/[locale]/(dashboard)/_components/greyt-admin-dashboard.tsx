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
  IndianRupee,
  Layers,
  PieChart,
  Plus,
  Scale,
  Search,
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
import { useMemo, useState } from "react";

export function GreytAdminDashboard({
  workspaceId,
}: {
  workspaceId: Id<"workspaces">;
}) {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [taskFilter, setTaskFilter] = useState<"all" | "leaves" | "payroll">("all");

  // Primary Queries
  const adminData = useQuery(api.dashboard.adminOperations, { workspaceId });
  const ownerData = useQuery(api.dashboard.ownerExecutiveSummary, {
    workspaceId,
    periodMonth: selectedPeriod || undefined,
  });
  const audit = useQuery(api.audit.recent, { workspaceId });
  const employees = useQuery(api.employees.list, { workspaceId });

  // Computed Department Breakdown
  const deptBreakdown = useMemo(() => {
    if (!employees || employees.length === 0) {
      return [
        { name: "Engineering", count: 2, pct: 50, color: "bg-blue-600" },
        { name: "Operations", count: 1, pct: 25, color: "bg-emerald-600" },
        { name: "Human Resources", count: 1, pct: 25, color: "bg-amber-600" },
      ];
    }
    const counts: Record<string, number> = {};
    employees.forEach((emp) => {
      const d = emp.department || "General";
      counts[d] = (counts[d] || 0) + 1;
    });
    const total = employees.length;
    const colors = [
      "bg-blue-600",
      "bg-emerald-600",
      "bg-amber-600",
      "bg-purple-600",
      "bg-cyan-600",
    ];
    return Object.entries(counts).map(([name, count], idx) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
      color: colors[idx % colors.length] ?? "bg-blue-600",
    }));
  }, [employees]);

  const activeEmployees = employees?.filter((e) => e.status === "active") ?? [];
  const pendingLeaves = adminData?.pendingLeaves ?? [];
  const latestRun = adminData?.activeRun;

  return (
    <div className="space-y-6">
      {/* ── greytHR Welcome Banner with Quick Shortcuts ────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-6 text-white shadow-lg">
        {/* Decorative background geometry */}
        <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-10 h-32 w-32 rounded-full bg-blue-400/20 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>IndiaPay Enterprise Admin Command Center</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Workforce, Payroll & Statutory Hub
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Unified administrative management conforming to greytHR operational standards.
              Real-time Indian compliance (EPF, ESIC, PT, TDS) and automated workflow execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/payroll">
              <Button className="bg-white text-blue-800 hover:bg-blue-50 font-semibold shadow-sm transition">
                <Banknote className="mr-1.5 h-4 w-4 text-blue-700" /> Run Monthly Payroll
              </Button>
            </Link>
            <Link href="/employees">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white transition"
              >
                <UserPlus className="mr-1.5 h-4 w-4" /> Add Employee
              </Button>
            </Link>
            <Link href="/compliance">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white transition"
              >
                <ShieldCheck className="mr-1.5 h-4 w-4" /> EPFO ECR
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Key Operational Metrics Ribbon ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Total & Active Employees */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Total Workforce
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {employees?.length ?? 4}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {activeEmployees.length} active
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Managed in directory</span>
            <Link href="/employees" className="text-blue-600 dark:text-blue-400 hover:underline">
              View Directory →
            </Link>
          </div>
        </div>

        {/* Metric 2: Today's Attendance & LOP */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Today&apos;s Attendance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {adminData?.currentMonthAttendanceCount ?? 1}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              punches logged
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>0 Unregularized LOP</span>
            <Link href="/attendance" className="text-blue-600 dark:text-blue-400 hover:underline">
              Daily Muster →
            </Link>
          </div>
        </div>

        {/* Metric 3: Pending Reviews & Requests */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Pending Approvals
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                pendingLeaves.length > 0
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pendingLeaves.length}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              leave requests
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>
              {pendingLeaves.length > 0 ? "Awaiting your action" : "All reviewed"}
            </span>
            <Link href="/attendance?tab=leaves" className="text-blue-600 dark:text-blue-400 hover:underline">
              Review Queue →
            </Link>
          </div>
        </div>

        {/* Metric 4: Latest Payroll Run */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Active Payroll Run
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate">
              {latestRun ? latestRun.status.replace("_", " ") : "NO RUN"}
            </span>
            {latestRun && (
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                ({latestRun.periodMonth})
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>
              {latestRun?.totalNetSalary
                ? `₹${latestRun.totalNetSalary.toLocaleString("en-IN")}`
                : "Ready to calculate"}
            </span>
            <Link href="/payroll" className="text-blue-600 dark:text-blue-400 hover:underline">
              Manage Payroll →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Urgent Operational Callout Banner ─────────────────────────────────── */}
      {latestRun?.status === "calculated" ? (
        <div className="rounded-xl border border-blue-500/30 bg-blue-50/80 p-5 dark:border-blue-500/30 dark:bg-blue-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Calculated Payroll Ready for Review ({latestRun.periodMonth})
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  Gross calculation completed for {latestRun.totalEmployees} employees. Verify statutory deductions and authorize to proceed.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                Review & Authorize <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : latestRun?.status === "pending_approval" ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-5 dark:border-amber-500/30 dark:bg-amber-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Payroll Awaiting Authorization ({latestRun.periodMonth})
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  This payroll run has been submitted. As Administrator, you have full authority to approve and release payslips.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700">
                Review & Approve <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : latestRun?.status === "approved" ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 p-5 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Payroll Approved — Ready to Finalize ({latestRun.periodMonth})
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  The payroll run is authorized. Finalize the run to lock ledger entries, release employee payslips, and generate bank disbursement files.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
                Finalize Payroll Run <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── greytHR 2-Column Command Workspace ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: "My Tasks" Queue & Statutory Compliance Monitor */}
        <div className="lg:col-span-2 space-y-6">
          {/* greytHR My Tasks Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 px-6 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    My Tasks & Approvals
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Administrative action items requiring your review
                  </p>
                </div>
              </div>

              {/* Task Filter Tabs */}
              <div className="mt-3 sm:mt-0 flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  onClick={() => setTaskFilter("all")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    taskFilter === "all"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  All ({pendingLeaves.length + (latestRun ? 1 : 0)})
                </button>
                <button
                  onClick={() => setTaskFilter("leaves")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    taskFilter === "leaves"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  Leaves ({pendingLeaves.length})
                </button>
                <button
                  onClick={() => setTaskFilter("payroll")}
                  className={`rounded-md px-2.5 py-1 transition ${
                    taskFilter === "payroll"
                      ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                >
                  Payroll ({latestRun?.status !== "processed" ? 1 : 0})
                </button>
              </div>
            </div>

            {/* Task Items List */}
            <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
              {pendingLeaves.length === 0 && latestRun?.status === "processed" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    All caught up!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                    No pending leave requests or unapproved payroll cycles requiring administrator action.
                  </p>
                </div>
              ) : (
                <>
                  {/* Payroll Review Task if pending */}
                  {(taskFilter === "all" || taskFilter === "payroll") &&
                    latestRun &&
                    latestRun.status !== "processed" && (
                      <div className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                            <Banknote className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                Monthly Payroll Cycle ({latestRun.periodMonth})
                              </h4>
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300 capitalize">
                                {latestRun.status.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              {latestRun.totalEmployees} employees • Gross: ₹
                              {latestRun.totalGrossSalary?.toLocaleString("en-IN") ?? "0"}
                            </p>
                          </div>
                        </div>
                        <Link href="/payroll">
                          <Button size="sm" variant="outline" className="text-xs">
                            Manage Run
                          </Button>
                        </Link>
                      </div>
                    )}

                  {/* Leave Approval Tasks */}
                  {(taskFilter === "all" || taskFilter === "leaves") &&
                    pendingLeaves.map((leave) => (
                      <div
                        key={leave._id}
                        className="flex items-center justify-between p-4 px-6 hover:bg-slate-50/50 dark:hover:bg-zinc-900/40 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                            <CalendarDays className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                                {leave.employeeName}
                              </h4>
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-300 capitalize">
                                {leave.leaveType} Leave
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                              {leave.startDate} to {leave.endDate} ({leave.daysCount} days)
                              {leave.reason ? ` • "${leave.reason}"` : ""}
                            </p>
                          </div>
                        </div>
                        <Link href="/attendance?tab=leaves">
                          <Button size="sm" variant="outline" className="text-xs">
                            Review Request
                          </Button>
                        </Link>
                      </div>
                    ))}
                </>
              )}
            </div>
          </div>

          {/* greytHR Statutory Compliance & Indian Remittance Deadlines */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Indian Statutory Compliance & Remittance Deadlines
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    EPFO ECR, ESIC, Form 138 TDS and State Professional Tax schedules
                  </p>
                </div>
              </div>
              <Link
                href="/compliance"
                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Configure Compliance →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    EPFO ECR Electronic Return
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    EPF @ 12%
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Monthly wage ceiling ₹15,000. Text format ECR generation for Unified Member Portal.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-zinc-300 border-t border-slate-200/60 pt-2 dark:border-zinc-800">
                  <span>Due Date: 15th of month</span>
                  <Link href="/compliance" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Generate ECR
                  </Link>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Form 138 / TDS Challan 281
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    Section 115BAC
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  Old vs. New tax regime comparison, 80C/80D investment deductions, and quarterly 24Q returns.
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-zinc-300 border-t border-slate-200/60 pt-2 dark:border-zinc-800">
                  <span>Due Date: 7th of month</span>
                  <Link href="/compliance" className="text-blue-600 dark:text-blue-400 hover:underline">
                    View Tax Slabs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Department Distribution & Quick Shortcuts */}
        <div className="space-y-6">
          {/* Workforce Distribution by Department */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Workforce Allocation
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                {employees?.length ?? 4} Staff
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {deptBreakdown.map((dept) => (
                <div key={dept.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700 dark:text-zinc-300">
                      {dept.name}
                    </span>
                    <span className="text-slate-500 dark:text-zinc-400">
                      {dept.count} ({dept.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${dept.color}`}
                      style={{ width: `${dept.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4 dark:border-zinc-800 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-zinc-400">
                Org Structure
              </span>
              <Link
                href="/people"
                className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                View Organization Tree →
              </Link>
            </div>
          </div>

          {/* greytHR Quick Favourites / Actions Widget */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions & Tools
                </h3>
              </div>
              <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                Admin
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/payroll"
                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 p-3 hover:border-blue-500/50 hover:bg-blue-50/30 transition dark:border-zinc-800 dark:hover:bg-blue-950/20"
              >
                <Banknote className="h-4 w-4 text-slate-600 group-hover:text-blue-600 dark:text-zinc-300 dark:group-hover:text-blue-400 transition-colors" />
                <span className="mt-2 text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Payroll Run
                </span>
              </Link>

              <Link
                href="/employees"
                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 p-3 hover:border-blue-500/50 hover:bg-blue-50/30 transition dark:border-zinc-800 dark:hover:bg-blue-950/20"
              >
                <UserPlus className="h-4 w-4 text-slate-600 group-hover:text-blue-600 dark:text-zinc-300 dark:group-hover:text-blue-400 transition-colors" />
                <span className="mt-2 text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  New Joiner
                </span>
              </Link>

              <Link
                href="/attendance"
                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 p-3 hover:border-blue-500/50 hover:bg-blue-50/30 transition dark:border-zinc-800 dark:hover:bg-blue-950/20"
              >
                <Clock className="h-4 w-4 text-slate-600 group-hover:text-blue-600 dark:text-zinc-300 dark:group-hover:text-blue-400 transition-colors" />
                <span className="mt-2 text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Attendance
                </span>
              </Link>

              <Link
                href="/reports"
                className="group flex flex-col justify-between rounded-xl border border-slate-200/80 p-3 hover:border-blue-500/50 hover:bg-blue-50/30 transition dark:border-zinc-800 dark:hover:bg-blue-950/20"
              >
                <FileSpreadsheet className="h-4 w-4 text-slate-600 group-hover:text-blue-600 dark:text-zinc-300 dark:group-hover:text-blue-400 transition-colors" />
                <span className="mt-2 text-xs font-medium text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  MIS Reports
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operational Audit Activity Feed ──────────────────────────────────── */}
      <div id="audit-logs" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              System Audit & Operational Event Trail
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            Immutable Ledger Logs
          </span>
        </div>

        <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800/80">
          {audit === undefined ? (
            <div className="py-6 text-center text-xs text-slate-400">Loading audit trail...</div>
          ) : audit.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">No recent audit events.</div>
          ) : (
            audit.slice(0, 6).map((log) => (
              <div
                key={log._id}
                className="flex items-center justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {log.action}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  {new Date(log.at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
