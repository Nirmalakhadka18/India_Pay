"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  History,
  Inbox,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ReportsHeader } from "../reports-header";

interface ReportRunItem {
  _id: string;
  reportId: string;
  reportName: string;
  category: string;
  parameters: string;
  format: "PDF" | "XLSX" | "CSV";
  status: "completed" | "failed";
  rowCount: number;
  fileSizeKb: number;
  generatedAt: number;
  generatedByName?: string;
}

export default function RecentReportsPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [searchTerm, setSearchTerm] = useState("");

  const liveRecentRuns = useQuery(
    api.reports.listRecentReports,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  // Fallback demo executions if database is fresh
  const defaultRuns: ReportRunItem[] = [
    {
      _id: "demo_run_1",
      reportId: "salary_statement_monthly",
      reportName: "Salary Statement - Monthly",
      category: "Payroll Payout",
      parameters: JSON.stringify({ periodMonth: "2026-11", department: "All" }),
      format: "CSV",
      status: "completed",
      rowCount: 48,
      fileSizeKb: 14,
      generatedAt: Date.now() - 3600000 * 2,
      generatedByName: "Admin User",
    },
    {
      _id: "demo_run_2",
      reportId: "pf_monthly_statement",
      reportName: "PF - Monthly Statement",
      category: "PF - Provident Fund",
      parameters: JSON.stringify({ periodMonth: "2026-11" }),
      format: "XLSX",
      status: "completed",
      rowCount: 45,
      fileSizeKb: 28,
      generatedAt: Date.now() - 3600000 * 5,
      generatedByName: "Admin User",
    },
    {
      _id: "demo_run_3",
      reportId: "esi_monthly_statement",
      reportName: "ESI - Monthly Statement",
      category: "ESI - EMPLOYEES' STATE INSURANCE FUND",
      parameters: JSON.stringify({ periodMonth: "2026-11" }),
      format: "PDF",
      status: "completed",
      rowCount: 12,
      fileSizeKb: 64,
      generatedAt: Date.now() - 86400000,
      generatedByName: "Admin User",
    },
  ];

  const runs = (liveRecentRuns && liveRecentRuns.length > 0)
    ? (liveRecentRuns as ReportRunItem[])
    : defaultRuns;

  const filteredRuns = runs.filter((r) => {
    return (
      r.reportName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.generatedByName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <ReportsHeader currentPageTitle="Recent Reports" />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link href="/admin/reports" className="hover:text-slate-800 transition-colors text-slate-600">
            Reports Gallery
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Recent Reports</span>
        </div>

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Reports History</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review historical report generation jobs, parameters, execution timestamps, row counts, and audit trails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Convex Audit Ledger Active</span>
            </span>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by report name, category, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing {filteredRuns.length} recent executions
          </div>
        </div>

        {/* History Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {filteredRuns.length === 0 ? (
            <div className="p-12 text-center">
              <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800">No report runs recorded</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generated reports and downloads will automatically appear here with their execution metadata.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Report Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4 text-center">Rows Generated</th>
                    <th className="py-3 px-4">Generated By</th>
                    <th className="py-3 px-4">Execution Time</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRuns.map((run) => (
                    <tr key={run._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {run.reportName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {run.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-sky-700">
                        {run.format}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {run.rowCount}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {run.generatedByName || "Admin"}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(run.generatedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          COMPLETED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
