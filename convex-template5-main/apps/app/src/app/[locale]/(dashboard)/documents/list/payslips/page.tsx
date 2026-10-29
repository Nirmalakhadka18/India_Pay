"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { type PayslipData, downloadPayslipPdf } from "@/lib/payslip-pdf";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="mb-5">
        <circle cx="45" cy="45" r="38" fill="#F3F4F6" />
        <rect x="28" y="24" width="34" height="42" rx="3" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
        <line x1="35" y1="35" x2="55" y2="35" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="42" x2="55" y2="42" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="35" y1="49" x2="46" y2="49" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="68" cy="22" r="4" fill="#E0E7FF" />
        <circle cx="22" cy="65" r="3" fill="#E0E7FF" />
      </svg>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        Looks like your payslip has not been generated yet. Drop by later and we&apos;ll have it ready for you
      </p>
    </div>
  );
}

export default function PayslipsListPage() {
  const { current: workspaceId, workspaces } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";
  const payslips = useQuery(api.payroll.getMyPayslips, scoped);
  const me = useQuery(api.employees.getMyProfile, scoped);
  const [downloadingRunId, setDownloadingRunId] = useState<string | null>(null);

  const activePayslipForDownload = useQuery(
    api.payroll.getPayslip,
    workspaceId && downloadingRunId && me
      ? { workspaceId, payrollRunId: downloadingRunId as Id<"payrollRuns">, employeeId: me._id }
      : "skip",
  );

  if (downloadingRunId && activePayslipForDownload) {
    downloadPayslipPdf(activePayslipForDownload as unknown as PayslipData);
    setDownloadingRunId(null);
  }

  if (!workspaceId) return <div className="p-8 text-sm text-gray-400">Select a workspace.</div>;

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 px-6 py-6 md:px-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/documents" className="text-xs text-blue-500 hover:underline">Document Center</Link>
        <span className="text-xs text-gray-400">/</span>
        <span className="text-xs text-gray-500">Payslips</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-block rounded-sm shrink-0" style={{ width: 4, height: 22, background: "#F59E0B" }} />
        <h1 className="text-xl font-semibold text-gray-800">Payslips</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {payslips === undefined || me === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : payslips.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payslips.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">
                    Salary Slip - {p.periodMonth} ({me?.firstName} {me?.lastName}).pdf
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">{p.periodMonth}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                      Published
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDownloadingRunId(p.payrollRunId)}
                      disabled={downloadingRunId === p.payrollRunId}
                      className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                      {downloadingRunId === p.payrollRunId ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                      ) : (
                        <><Download className="h-3.5 w-3.5" /> Download</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
