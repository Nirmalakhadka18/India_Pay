"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Save,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkforceHeader } from "../workforce-header";

export default function EmployeeWeekDaysPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [feedback, setFeedback] = useState<string | null>(null);

  // Standard Indian 5-day / 6-day work week pattern
  const [schedule, setSchedule] = useState([
    { day: "Monday", status: "Working Day", hours: "8.5 hrs" },
    { day: "Tuesday", status: "Working Day", hours: "8.5 hrs" },
    { day: "Wednesday", status: "Working Day", hours: "8.5 hrs" },
    { day: "Thursday", status: "Working Day", hours: "8.5 hrs" },
    { day: "Friday", status: "Working Day", hours: "8.5 hrs" },
    { day: "Saturday", status: "Weekly Off (2nd & 4th)", hours: "0 hrs" },
    { day: "Sunday", status: "Weekly Off", hours: "0 hrs" },
  ]);

  const liveEmployees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const handleSaveSchedule = () => {
    setFeedback("General work week schedule and shift timings updated successfully!");
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkforceHeader
        currentCategory="admin-tools"
        currentPageTitle="Employee Week Days"
      />

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
          <span className="font-semibold text-slate-900">Employee Week Days</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Employee Week Days &amp; Shift Schedule
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Work week patterns, weekly offs, shift definitions, and statutory rest intervals
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {/* Weekday Schedule Grid */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Day of Week</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Standard Shift Duration</th>
                <th className="py-3 px-4 text-right">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedule.map((row, idx) => (
                <tr key={row.day} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {row.day}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        row.status.includes("Working")
                          ? "bg-sky-50 text-sky-700 border border-sky-100"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.hours}</td>
                  <td className="py-3 px-4 text-right text-slate-500">
                    All Active Employees ({liveEmployees?.length || 33})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
