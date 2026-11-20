"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CreditCard,
  FileText,
  History,
  Plane,
  Shield,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { EmployeeHeader } from "../employee-header";

interface GenericInfoPageProps {
  title: string;
  description: string;
  category: "information";
}

export function GenericInformationTemplate({
  title,
  description,
}: GenericInfoPageProps) {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("id");
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const selectedEmployee =
    (employees ?? []).find((e) => e._id === employeeId) || employees?.[0];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <EmployeeHeader currentCategory="information" currentPageTitle={title} />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-12">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {description} for {selectedEmployee?.firstName}{" "}
            {selectedEmployee?.lastName || ""} (
            {selectedEmployee?.employeeIdNumber || "EMP-001"})
          </p>
        </div>

        {/* Content Box */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-2xs text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
            <FileText className="h-6 w-6 text-sky-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">
            Verified Employee Records
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Official record entries are synchronized with organization master
            compliance records. All changes are logged into the audit ledger.
          </p>

          <div className="mt-6 border-t border-slate-100 pt-4 max-w-xl mx-auto text-left">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Record Type</span>
                <span className="font-semibold text-slate-800">{title}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status</span>
                <span className="font-semibold text-emerald-600">
                  Active &amp; Compliant
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">
                  Last Verified
                </span>
                <span className="font-medium text-slate-700">01-Nov-2026</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Managed By</span>
                <span className="font-medium text-slate-700">
                  HR Operations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
