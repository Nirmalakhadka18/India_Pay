"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Calendar, CheckCircle2, FileText, Filter, Plus, Search, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkforceHeader } from "./workforce-header";

interface GenericLeavePageProps {
  title: string;
  category: "leave" | "admin-tools";
  description: string;
}

export function GenericLeaveTemplate({
  title,
  category,
  description,
}: GenericLeavePageProps) {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkforceHeader currentCategory={category} currentPageTitle={title} />

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
          <span className="font-semibold text-slate-900">{title}</span>
        </div>

        {/* Title and Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure {title}</span>
            </button>
          </div>
        </div>

        {/* Filter & Operations Canvas */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${title}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Filter By Year:</span>
              <select
                aria-label="Filter Year"
                className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* Operational Status Box */}
          <div className="rounded border border-slate-100 bg-slate-50/60 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-sky-600 mb-3 shadow-2xs">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {title} Service Operational
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Statutory attendance policies, calendar overrides, and leave quota balances are enforced in real-time according to state factory and shop establishment rules.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Compliant with Indian Leave Policies</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
