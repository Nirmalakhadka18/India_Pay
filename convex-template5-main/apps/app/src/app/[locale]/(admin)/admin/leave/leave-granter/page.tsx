"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkforceHeader } from "../workforce-header";

export default function LeaveGranterPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [grantMode, setGrantMode] = useState<"all" | "newly_joined">("all");
  const [periodicity, setPeriodicity] = useState("Monthly");
  const [period, setPeriod] = useState("Nov 2026");
  const [leaveScheme, setLeaveScheme] = useState("General Leave Scheme");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    "casual",
    "sick",
    "earned",
  ]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live queries
  const liveEmployees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const handleExecuteGrant = () => {
    setStatusMessage(
      `Leave allotment initiated for ${liveEmployees?.length || 33} employees under ${leaveScheme}. Accrual balances updated for ${period}.`
    );
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkforceHeader currentCategory="leave" currentPageTitle="Leave Granter" />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link
            href="/admin/leave/overview"
            className="hover:text-slate-800 transition-colors font-medium text-slate-700"
          >
            Leave
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Leave Granter</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Leave Granter
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periodic leave allotment, quota grant rules and accrual processing engine
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteGrant}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Grant</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Scope Selector Tabs matching greytHR */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-6">
          <div className="flex items-center gap-6 border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setGrantMode("all")}
              className={`text-xs font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                grantMode === "all"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Grant for all employees
            </button>
            <button
              type="button"
              onClick={() => setGrantMode("newly_joined")}
              className={`text-xs font-semibold pb-1 border-b-2 transition-all cursor-pointer ${
                grantMode === "newly_joined"
                  ? "border-sky-600 text-sky-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Grant for newly joined employees
            </button>
          </div>

          {/* Form Fields matching greytHR DOM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Periodicity
              </label>
              <select
                value={periodicity}
                onChange={(e) => setPeriodicity(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Period
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="Nov 2026">Nov 2026</option>
                <option value="Dec 2026">Dec 2026</option>
                <option value="Jan 2027">Jan 2027</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Leave Scheme
              </label>
              <select
                value={leaveScheme}
                onChange={(e) => setLeaveScheme(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="General Leave Scheme">General Leave Scheme</option>
                <option value="Factory/Plant Scheme">Factory/Plant Scheme</option>
                <option value="Probationary Scheme">Probationary Scheme</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1.5">
                Upcoming Auto Grant Date
              </label>
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 font-semibold">
                01-Dec-2026
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-600 font-medium mb-1.5">
                Leave Types Allotted
              </label>
              <div className="flex flex-wrap gap-4 pt-1">
                {[
                  { id: "casual", label: "Casual Leave (1.25 days/mo)" },
                  { id: "sick", label: "Sick Leave (1.0 days/mo)" },
                  { id: "earned", label: "Earned Leave (1.75 days/mo)" },
                ].map((lt) => (
                  <label key={lt.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(lt.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedTypes([...selectedTypes, lt.id]);
                        else setSelectedTypes(selectedTypes.filter((t) => t !== lt.id));
                      }}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-slate-700 font-medium">{lt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
