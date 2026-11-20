"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Activity,
  Award,
  BarChart3,
  Building,
  CheckCircle2,
  FileCheck,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  PieChart,
  Smartphone,
  TrendingUp,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function AnalyticsHubPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );
  const adminData = useQuery(
    api.dashboard.adminOperations,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const [helpOpen, setHelpOpen] = useState(true);

  const total = employees?.length ?? 33;
  const active = employees?.filter((e) => e.status === "active").length ?? 33;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader currentCategory="main" currentPageTitle="Analytics Hub" />

      {/* Help Banner */}
      {helpOpen && (
        <div className="mx-4 sm:mx-8 mt-3 rounded-md border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-2.5 text-xs text-[#0369A1] shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-[#0284C7]" />
              <p>
                The <span className="font-semibold">Analytics Hub</span>{" "}
                provides key workforce metrics, head count trends, and
                engagement statistics across your organization.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="text-xs font-medium text-[#0284C7] hover:underline ml-4 shrink-0"
            >
              Hide Help
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Metrics Grid */}
      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        {/* Row 1: Key Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Head Count
              </span>
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{total}</span>
              <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +12%
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Total active workforce
            </p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Mobile App Users
              </span>
              <Smartphone className="h-4 w-4 text-purple-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">28</span>
              <span className="text-xs font-medium text-slate-500">
                85% adoption
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Active mobile sessions this month
            </p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Helpdesk Tickets
              </span>
              <HelpCircle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">2</span>
              <span className="text-xs font-medium text-emerald-600">
                100% SLA met
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Open employee queries
            </p>
          </div>

          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Letters Generated
              </span>
              <FileCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">14</span>
              <span className="text-xs font-medium text-slate-500">
                This quarter
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Appointment &amp; confirmation letters
            </p>
          </div>
        </div>

        {/* Row 2: Charts & Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Head Count Trend */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Employees Head Count Trend
            </h3>
            <div className="h-48 w-full flex items-end justify-between gap-2 pt-6 px-4 border-b border-slate-100">
              {[
                { month: "Jun", count: 26 },
                { month: "Jul", count: 27 },
                { month: "Aug", count: 29 },
                { month: "Sep", count: 32 },
                { month: "Oct", count: 33 },
                { month: "Nov", count: 33 },
              ].map((bar) => (
                <div
                  key={bar.month}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <span className="text-xs font-semibold text-sky-700">
                    {bar.count}
                  </span>
                  <div
                    className="w-full bg-sky-500 rounded-t-sm transition-all"
                    style={{ height: `${(bar.count / 35) * 100}%` }}
                  />
                  <span className="text-[11px] text-slate-500">
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Department Distribution
            </h3>
            <div className="space-y-3 pt-2">
              {[
                {
                  dept: "Engineering & AI",
                  count: 18,
                  pct: 55,
                  color: "bg-sky-500",
                },
                {
                  dept: "Human Resources",
                  count: 4,
                  pct: 12,
                  color: "bg-purple-500",
                },
                {
                  dept: "Operations & Admin",
                  count: 6,
                  pct: 18,
                  color: "bg-emerald-500",
                },
                {
                  dept: "Sales & Marketing",
                  count: 5,
                  pct: 15,
                  color: "bg-amber-500",
                },
              ].map((d) => (
                <div key={d.dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{d.dept}</span>
                    <span className="text-slate-500">
                      {d.count} ({d.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 3: Employee Lifecycle Cards */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">
            Employee Lifecycle Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-md border border-slate-100 bg-slate-50/50 p-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Joined this Month</p>
                <p className="text-lg font-bold text-slate-800">1 Employee</p>
              </div>
            </div>

            <div className="rounded-md border border-slate-100 bg-slate-50/50 p-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Confirmed</p>
                <p className="text-lg font-bold text-slate-800">32 Employees</p>
              </div>
            </div>

            <div className="rounded-md border border-slate-100 bg-slate-50/50 p-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <UserMinus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Separations Pending</p>
                <p className="text-lg font-bold text-slate-800">0 Employees</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
