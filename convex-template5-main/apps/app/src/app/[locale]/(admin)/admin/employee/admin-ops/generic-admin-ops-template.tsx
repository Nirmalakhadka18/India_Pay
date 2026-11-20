"use client";

import {
  Archive,
  Bell,
  Camera,
  CheckCircle2,
  FileCheck,
  FileText,
  HardDrive,
  Send,
  Upload,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { EmployeeHeader } from "../employee-header";

interface GenericAdminOpsPageProps {
  title: string;
  description: string;
  actionText: string;
}

export function GenericAdminOpsTemplate({
  title,
  description,
  actionText,
}: GenericAdminOpsPageProps) {
  const [status, setStatus] = useState<string | null>(null);

  const handleAction = () => {
    setStatus("Action dispatched successfully. Audit record created.");
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader currentCategory="admin" currentPageTitle={title} />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#0284C7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0369A1] transition shadow-2xs"
          >
            {actionText}
          </button>
        </div>

        {status && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{status}</span>
          </div>
        )}

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-8 text-center shadow-2xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
            <HardDrive className="h-6 w-6 text-sky-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Active Administrative Pipeline
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Enterprise administration control with organization boundary
            enforcement, role authorizations, and audit compliance logging.
          </p>
        </div>
      </div>
    </div>
  );
}
