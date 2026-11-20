"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileUp,
  Filter,
  Info,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PayrollHeader } from "../payroll-header";

export default function PayrollInputsPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeCategory, setActiveCategory] = useState<
    "attendance" | "leaves" | "reimbursements" | "overtime" | "deductions"
  >("attendance");
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced">(
    "idle",
  );

  const attendanceData = [
    {
      empId: "IND-01",
      name: "Govramma KI",
      department: "Engineering",
      payableDays: 30,
      lopDays: 0,
      overtimeHours: 8,
      status: "Verified",
    },
    {
      empId: "IND-02",
      name: "Ajay Kumawat",
      department: "Design",
      payableDays: 29,
      lopDays: 1,
      overtimeHours: 0,
      status: "Verified",
    },
    {
      empId: "IND-03",
      name: "Abdul Matin",
      department: "Finance",
      payableDays: 30,
      lopDays: 0,
      overtimeHours: 4,
      status: "Verified",
    },
    {
      empId: "IND-04",
      name: "Ram Sanjay Kayarkar",
      department: "Operations",
      payableDays: 28,
      lopDays: 2,
      overtimeHours: 0,
      status: "Pending Review",
    },
    {
      empId: "IND-05",
      name: "Srishti Verma",
      department: "HR",
      payableDays: 30,
      lopDays: 0,
      overtimeHours: 0,
      status: "Verified",
    },
  ];

  const handleSync = () => {
    setSyncStatus("syncing");
    setTimeout(() => {
      setSyncStatus("synced");
    }, 1500);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F7] text-[#394657] font-sans antialiased text-[14px]">
      <PayrollHeader currentTab="inputs" />

      <main className="flex-1 w-full p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Banner: Monthly Input Freeze Warning */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#BAE6FD] bg-[#F0F9FF] p-4 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-[#0284C7] flex-shrink-0" />
            <div>
              <span className="font-bold text-slate-900">
                November 2026 Payroll Input Cycle:
              </span>{" "}
              <span className="text-slate-600">
                Cutoff scheduled for 25th Nov 2026. All attendance
                regularizations, claims, and revisions must be verified.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSync}
              disabled={syncStatus === "syncing"}
              className="flex items-center gap-1.5 rounded bg-white border border-[#CBD5E1] px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 ${syncStatus === "syncing" ? "animate-spin" : ""}`}
              />
              {syncStatus === "syncing"
                ? "Syncing..."
                : syncStatus === "synced"
                  ? "Synced with Biometric"
                  : "Sync Attendance Data"}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded bg-[#3E5ECC] px-3.5 py-1.5 font-semibold text-white hover:bg-[#2E4AA3] transition shadow-xs"
            >
              <FileUp className="h-3.5 w-3.5" />
              Import Inputs CSV
            </button>
          </div>
        </div>

        {/* Input Categories Selector */}
        <div className="flex items-center gap-2 border-b border-[#E4E9F0] pb-3 text-xs">
          {[
            { id: "attendance", label: "Attendance & LOP (33)" },
            { id: "leaves", label: "Leave Adjustments (3)" },
            { id: "reimbursements", label: "Claims & Reimbursements (4)" },
            { id: "overtime", label: "Overtime Hours (2)" },
            { id: "deductions", label: "Ad-hoc Deductions (0)" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
              className={`rounded-full px-4 py-1.5 font-semibold transition ${
                activeCategory === cat.id
                  ? "bg-[#3557CA] text-white shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table View */}
        <div className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-[#394657] capitalize">
                {activeCategory} Input Ledger
              </h3>
              <p className="text-xs text-[#5A6A7C] mt-0.5">
                Review and approve monthly employee adjustment records before
                payroll computation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                Export Sample Template
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs text-[#394657] border-collapse">
            <thead>
              <tr className="border-b border-[#E4E9F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#5A6A7C]">
                <th className="py-3 px-4 font-semibold">Employee ID</th>
                <th className="py-3 px-4 font-semibold">Employee Name</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Payable Days</th>
                <th className="py-3 px-4 font-semibold">Loss of Pay (LOP)</th>
                <th className="py-3 px-4 font-semibold">Overtime</th>
                <th className="py-3 px-4 font-semibold">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F2F5]">
              {attendanceData.map((row) => (
                <tr key={row.empId} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {row.empId}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{row.department}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {row.payableDays} / 30
                  </td>
                  <td className="py-3 px-4">
                    {row.lopDays > 0 ? (
                      <span className="font-semibold text-rose-600">
                        {row.lopDays} Day(s)
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {row.overtimeHours > 0 ? `${row.overtimeHours} hrs` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        row.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.status === "Verified" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Floating What's New Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-[#9333EA] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#7E22CE] transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          What&apos;s New!
        </button>
      </div>
    </div>
  );
}
