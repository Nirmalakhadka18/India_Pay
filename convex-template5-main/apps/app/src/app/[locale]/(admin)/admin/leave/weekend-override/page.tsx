"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Sliders,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkforceHeader } from "../workforce-header";

export default function WeekendOverridePage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [overrides, setOverrides] = useState([
    {
      id: "wo-1",
      date: "2026-11-14",
      day: "Saturday",
      overrideType: "Working Day (Compensatory Off for Festival)",
      appliesTo: "All Employees",
      status: "Active",
    },
    {
      id: "wo-2",
      date: "2026-11-28",
      day: "Saturday",
      overrideType: "Full Day Holiday (General)",
      appliesTo: "All Employees",
      status: "Active",
    },
  ]);

  const [newDate, setNewDate] = useState("2026-12-12");
  const [newType, setNewType] = useState("Working Day");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAddOverride = () => {
    const newEntry = {
      id: `wo-${Date.now()}`,
      date: newDate,
      day: "Saturday",
      overrideType: `${newType} (Custom Override)`,
      appliesTo: "All Employees",
      status: "Active",
    };
    setOverrides([...overrides, newEntry]);
    setFeedback(`Weekend override successfully added for ${newDate}!`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = (id: string) => {
    setOverrides(overrides.filter((o) => o.id !== id));
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkforceHeader
        currentCategory="admin-tools"
        currentPageTitle="Weekend Override"
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
          <span className="font-semibold text-slate-900">Weekend Override</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Weekend Override
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure company-wide working weekends, compensatory offs, and weekend schedule swaps
              </p>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {/* Add Override Form */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider text-slate-500">
            Create Weekend Override
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs max-w-4xl">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Target Weekend Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Override Nature
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="Working Day">Working Day (Compensatory Off)</option>
                <option value="Special Holiday">Special Holiday</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddOverride}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Save Override</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table of active overrides */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Override Classification</th>
                <th className="py-3 px-4">Coverage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {overrides.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {item.date}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.day}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100">
                      {item.overrideType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{item.appliesTo}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
