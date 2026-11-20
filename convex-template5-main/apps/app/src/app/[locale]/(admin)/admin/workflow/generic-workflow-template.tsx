"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { CheckCircle2, FileText, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "./workflow-header";

interface GenericWorkflowPageProps {
  moduleName: string;
  moduleId:
    | "leave"
    | "leave-comp-off"
    | "leave-cancel"
    | "help-desk"
    | "rh-leave"
    | "employee-onboarding"
    | "resignation"
    | "confirmation"
    | "setup";
  description: string;
}

export function GenericWorkflowTemplate({
  moduleName,
  moduleId,
  description,
}: GenericWorkflowPageProps) {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule={moduleId}
        currentPageTitle={`${moduleName} Workflow`}
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link
            href="/admin/workflow/leave"
            className="hover:text-slate-800 transition-colors font-medium text-slate-700"
          >
            Workflow
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">{moduleName}</span>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">{moduleName}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure {moduleName}</span>
            </button>
          </div>
        </div>

        {/* Operational Canvas */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${moduleName}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Status:</span>
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Workflow Active
              </span>
            </div>
          </div>

          <div className="rounded border border-slate-100 bg-slate-50/60 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-sky-600 mb-3 shadow-2xs">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {moduleName} Rules Engine Active
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Approval hierarchies, reviewer levels, and delegation triggers are managed according to the organization workflow policy.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Level Approval Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
