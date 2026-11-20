"use client";

import {
  CheckCircle2,
  FileText,
  Filter,
  Layers,
  Plus,
  Shield,
  Sliders,
} from "lucide-react";
import { useState } from "react";
import { EmployeeHeader } from "../employee-header";

interface GenericSetupPageProps {
  title: string;
  description: string;
  actionText: string;
}

export function GenericSetupTemplate({
  title,
  description,
  actionText,
}: GenericSetupPageProps) {
  const [created, setCreated] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader currentCategory="setup" currentPageTitle={title} />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>

          <button
            type="button"
            onClick={() => setCreated(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1] transition shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            {actionText}
          </button>
        </div>

        {created && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Setup configuration entry saved and synchronized across active
              payroll entities.
            </span>
          </div>
        )}

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
            <Sliders className="h-6 w-6 text-sky-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Operational Configuration Engine
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Rules, employee grouping criteria, and department compliance filters
            configured here are applied in real-time across employee rosters and
            payroll processing runs.
          </p>
        </div>
      </div>
    </div>
  );
}
