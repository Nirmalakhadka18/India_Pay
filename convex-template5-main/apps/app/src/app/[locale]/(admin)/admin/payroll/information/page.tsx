"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  Search,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PayrollHeader } from "../payroll-header";

export default function PayrollInformationPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const [activeSubTab, setActiveSubTab] = useState<
    "calendar" | "profiles" | "structures"
  >("calendar");
  const [searchTerm, setSearchTerm] = useState("");

  const payrollCalendar = [
    {
      period: "November 2026",
      cutoff: "25 Nov 2026",
      payDate: "30 Nov 2026",
      status: "Active Processing",
      workDays: 30,
    },
    {
      period: "October 2026",
      cutoff: "25 Oct 2026",
      payDate: "31 Oct 2026",
      status: "Finalized & Paid",
      workDays: 31,
    },
    {
      period: "September 2026",
      cutoff: "25 Sep 2026",
      payDate: "30 Sep 2026",
      status: "Finalized & Paid",
      workDays: 30,
    },
    {
      period: "August 2026",
      cutoff: "25 Aug 2026",
      payDate: "31 Aug 2026",
      status: "Finalized & Paid",
      workDays: 31,
    },
  ];

  const salaryStructures = [
    {
      name: "Standard Corporate CTC",
      basePercent: "40%",
      hraPercent: "20%",
      allowances: "Special, Medical, Conveyance",
      statutory: "PF (12%), ESI, PT",
      employeesCount: 28,
    },
    {
      name: "Executive CTC Structure",
      basePercent: "50%",
      hraPercent: "25%",
      allowances: "Executive Allowance, Car Lease, LTA",
      statutory: "PF (12%), PT",
      employeesCount: 5,
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F7] text-[#394657] font-sans antialiased text-[14px]">
      <PayrollHeader currentTab="information" />

      <main className="flex-1 w-full p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Sub-navigation Pills */}
        <div className="flex items-center gap-2 border-b border-[#E4E9F0] pb-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("calendar")}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              activeSubTab === "calendar"
                ? "bg-[#3557CA] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Payroll Calendar & Periods
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("profiles")}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              activeSubTab === "profiles"
                ? "bg-[#3557CA] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Employee Payroll Profiles ({employees?.length ?? 33})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("structures")}
            className={`rounded-full px-4 py-1.5 font-semibold transition ${
              activeSubTab === "structures"
                ? "bg-[#3557CA] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Salary Structures & Rules
          </button>
        </div>

        {/* Tab 1: Payroll Calendar */}
        {activeSubTab === "calendar" && (
          <div className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#394657]">
                  Payroll Calendar & Cutoff Dates
                </h3>
                <p className="text-xs text-[#5A6A7C] mt-0.5">
                  Scheduled pay cycles, attendance lock dates, and disbursement
                  deadlines for FY 2026-2027.
                </p>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded bg-[#EDF3FF] text-[#3E5ECC] border border-[#CBD5E1] px-3 py-1.5 text-xs font-semibold hover:bg-blue-100 transition"
              >
                <Download className="h-3.5 w-3.5" />
                Export Calendar
              </button>
            </div>

            <table className="w-full text-left text-xs text-[#394657] border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#5A6A7C]">
                  <th className="py-3 px-4 font-semibold">Pay Period</th>
                  <th className="py-3 px-4 font-semibold">Attendance Cutoff</th>
                  <th className="py-3 px-4 font-semibold">
                    Scheduled Pay Date
                  </th>
                  <th className="py-3 px-4 font-semibold">Work Days</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {payrollCalendar.map((row) => (
                  <tr key={row.period} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.period}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{row.cutoff}</td>
                    <td className="py-3 px-4 text-slate-600">{row.payDate}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.workDays} Days
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          row.status.includes("Active")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Employee Payroll Profiles */}
        {activeSubTab === "profiles" && (
          <div className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#394657]">
                  Employee Payroll Master Profiles
                </h3>
                <p className="text-xs text-[#5A6A7C] mt-0.5">
                  PAN, UAN, Bank Account, and Statutory Tax Regime assignments.
                </p>
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, employee code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white py-1.5 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-[#3E5ECC] w-64 shadow-2xs"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs text-[#394657] border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9F0] bg-[#F8FAFC] text-[11px] uppercase tracking-wider text-[#5A6A7C]">
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Designation</th>
                  <th className="py-3 px-4 font-semibold">Tax Regime</th>
                  <th className="py-3 px-4 font-semibold">Payment Mode</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2F5]">
                {(employees ?? []).slice(0, 10).map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {emp.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.department ?? "Engineering"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.designation ?? "Specialist"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        New Regime (115BAC)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      Bank Transfer (HDFC)
                    </td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Salary Structures */}
        {activeSubTab === "structures" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {salaryStructures.map((struct) => (
              <div
                key={struct.name}
                className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                  <h4 className="text-sm font-bold text-[#394657]">
                    {struct.name}
                  </h4>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#3E5ECC]">
                    {struct.employeesCount} Employees
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Basic Pay:</span>
                    <span className="font-semibold text-slate-800">
                      {struct.basePercent} of Total CTC
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">
                      House Rent Allowance (HRA):
                    </span>
                    <span className="font-semibold text-slate-800">
                      {struct.hraPercent} of Total CTC
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Flexible Allowances:</span>
                    <span className="font-semibold text-slate-800">
                      {struct.allowances}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">
                      Statutory Components:
                    </span>
                    <span className="font-semibold text-slate-800">
                      {struct.statutory}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
