"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Lock,
  Pencil,
  Sparkles,
  Trash2,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PayrollHeader } from "./payroll-header";

interface MonthItem {
  label: string;
  year: string;
  locked: boolean;
  isNew?: boolean;
  current?: boolean;
}

export default function PayrollOverviewPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  // Convex data query
  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const [helpOpen, setHelpOpen] = useState(true);
  const [activeMonth, setActiveMonth] = useState("Nov");

  // Interactive control states matching greytHR operational toggles
  const [payrollInputsLocked, setPayrollInputsLocked] = useState(true);
  const [employeeViewReleased, setEmployeeViewReleased] = useState(true);
  const [itStatementReleased, setItStatementReleased] = useState(true);
  const [payrollLocked, setPayrollLocked] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 12-month timeline exactly matching greytHR Nov 2026 active cycle
  const months: MonthItem[] = [
    { label: "Apr", year: "2026", locked: true },
    { label: "May", year: "2026", locked: true },
    { label: "Jun", year: "2026", locked: true },
    { label: "Jul", year: "2026", locked: true },
    { label: "Aug", year: "2026", locked: true },
    { label: "Sep", year: "2026", locked: true },
    { label: "Oct", year: "2026", locked: true },
    { label: "Nov", year: "2026", locked: false, current: true },
    { label: "Dec", year: "2026", locked: false, isNew: true },
    { label: "Jan", year: "2027", locked: false },
    { label: "Feb", year: "2027", locked: false },
    { label: "Mar", year: "2027", locked: false },
  ];

  const totalEmployeesCount = employees?.length ?? 33;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F7] text-[#394657] font-sans antialiased text-[14px]">
      {/* ── Level 1 & 2 Header with Full 8-Category Flyouts ── */}
      <PayrollHeader currentTab="overview" />

      {/* ── Main Viewport Content matching greytHR cougar-container ── */}
      <main className="flex-1 w-full p-4 sm:p-5 space-y-4 max-w-[1920px] mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 right-6 z-50 rounded bg-[#1E293B] px-4 py-2 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        {/* 1. Help Banner Container */}
        {helpOpen && (
          <div className="relative rounded bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-[13px] leading-relaxed text-[#5A6A7C] shadow-2xs">
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="absolute top-4 right-4 text-xs font-semibold text-[#0d6efd] hover:underline"
            >
              Hide Help
            </button>
            <p>
              The <strong className="text-slate-800">Overview</strong> page
              gives you a summary of the current month&apos;s payroll. All data
              that you view and activities you perform, such as Locking or
              Unlocking the Payroll Inputs, Payroll, and IT Statement, are for
              the current month&apos;s payroll. Once done, all data you view and
              the activities you perform are specific to that chosen payroll
              month. You can also view details related to the Net Payout Amount
              for the chosen payroll month.
            </p>
            <p className="mt-2 text-xs">
              Explore the Payroll overview page with{" "}
              <a href="#help-doc" className="text-[#0d6efd] hover:underline">
                Help-Doc
              </a>
              ,{" "}
              <a href="#videos" className="text-[#0d6efd] hover:underline">
                How-to Videos
              </a>{" "}
              and{" "}
              <a href="#faqs" className="text-[#0d6efd] hover:underline">
                FAQs
              </a>
              .
            </p>
          </div>
        )}

        {/* 2. 12-Month Payroll Slider / Timeline */}
        <div className="flex items-center justify-between bg-white rounded border border-[#E4E9F0] py-1.5 px-3 shadow-2xs overflow-x-auto">
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 transition"
            title="Previous Year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-around">
            {months.map((m) => {
              const isSelected = activeMonth === m.label;
              return (
                <div
                  key={m.label}
                  onClick={() => {
                    setActiveMonth(m.label);
                    showToast(`Selected ${m.label} ${m.year} payroll`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActiveMonth(m.label); }}
                  className={`flex flex-col items-center justify-center cursor-pointer px-4 py-1.5 rounded transition text-center min-w-[76px] relative select-none ${
                    isSelected
                      ? "bg-[#3557CA] text-white font-semibold shadow-xs"
                      : "text-[#5A6A7C] hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1 text-[13px]">
                    {m.locked && (
                      <Lock className="h-3 w-3 inline text-slate-400" />
                    )}
                    <span>{m.label}</span>
                    {m.isNew && (
                      <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[9px] px-1 rounded-sm font-bold leading-tight">
                        New
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] ${
                      isSelected ? "text-blue-100" : "text-slate-400"
                    }`}
                  >
                    {m.year}
                  </span>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-600 transition"
            title="Next Year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* 3. PF Ceiling Limit Notification Strip */}
        <div className="flex items-center gap-2 rounded border border-[#F5C573] bg-[#FFF7EB] px-4 py-2.5 text-[13px] text-[#394657]">
          <Info className="h-4 w-4 text-[#F2B13F] flex-shrink-0" />
          <span>
            PF wage ceiling limit revision is effective from September 2026
            Payroll. To modify, please{" "}
            <Link
              href="/admin/payroll/setup"
              className="text-[#0d6efd] font-medium hover:underline"
            >
              click here
            </Link>
            .
          </span>
        </div>

        {/* 4. Month Title & Process Payroll Strip */}
        <div className="flex items-center justify-between rounded-t border-t border-x border-[#E4E9F0] bg-[#EEF2F6]/60 px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#394657]">
                {activeMonth === "Nov"
                  ? "November 2026"
                  : `${activeMonth} 2026`}
              </h2>
              <button
                type="button"
                onClick={() =>
                  showToast("Payroll deletion is disabled in verified mode")
                }
                title="Delete Payroll"
                className="text-[#0d6efd] hover:text-blue-800 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#5A6A7C] italic mt-0.5">
              <span>
                Cutoff from 01 {activeMonth} 2026 to 30 {activeMonth} 2026
              </span>
              <button
                type="button"
                onClick={() => showToast("Edit cutoff period opened")}
                title="Edit Cutoff"
                className="text-[#0d6efd] hover:text-blue-800 not-italic"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              title="Payroll Processed on 04 Nov 2026"
              className="text-[#0d6efd] cursor-pointer"
            >
              <Info className="h-5 w-5" />
            </span>
            <Link
              href="/admin/payroll/process"
              className="rounded bg-[#0d6efd] px-5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0b5ed7] transition"
            >
              Process Payroll
            </Link>
          </div>
        </div>

        {/* 5. Upper Content Card: 3 Columns (Payout Details, Employee Details, Actions) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 rounded-b border border-[#E4E9F0] bg-white p-5 shadow-xs">
          {/* Column 1: Payout Details */}
          <div className="md:col-span-4 border-r border-[#F0F2F5] pr-6">
            <h3 className="text-base font-bold text-[#394657]">
              Payout Details
            </h3>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#FCD2CA]" />
                <span className="text-lg font-bold text-[#394657]">
                  ₹19,33,496.00
                </span>
              </div>
              <p className="text-xs text-[#5A6A7C] pl-4">Net Pay</p>
            </div>

            {/* Custom Circular Doughnut Chart matching greytHR overview */}
            <div className="my-4 flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  {/* Gross segment */}
                  <path
                    className="text-[#A6B7F7]"
                    strokeWidth="4"
                    strokeDasharray="92, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Deductions segment */}
                  <path
                    className="text-[#FCD2CA]"
                    strokeWidth="4"
                    strokeDasharray="8, 100"
                    strokeDashoffset="-92"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>

            {/* Metrics Breakdown Table */}
            <table className="w-full text-xs text-[#394657] mt-2">
              <tbody>
                <tr>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#A6B7F7]" />
                      <span className="font-semibold text-slate-800">
                        ₹20,89,498.00
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Gross Pay
                    </div>
                  </td>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#71DBE3]" />
                      <span className="font-semibold text-slate-800">
                        ₹1,56,002.00
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Deductions
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2" colSpan={2}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#37C0D3]" />
                      <span className="font-semibold text-slate-800">30</span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Work Days
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Column 2: Employee Details */}
          <div className="md:col-span-4 border-r border-[#F0F2F5] px-6">
            <h3 className="text-base font-bold text-[#394657]">
              Employee Details
            </h3>
            <div className="rounded-lg bg-[#EDFAED] border border-[#E2F0E2] p-3 mt-3 mb-4">
              <div className="text-lg font-bold text-[#394657]">
                {totalEmployeesCount}
              </div>
              <div className="text-xs text-[#5A6A7C]">Total Employees</div>
              <div className="text-xs text-[#48A84D] font-medium mt-0.5">
                +1 vs previous month
              </div>
            </div>

            {/* Lifecycle Stats Table */}
            <table className="w-full text-xs text-[#394657]">
              <tbody>
                <tr>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#A6B7F7]" />
                      <span className="font-semibold">01</span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Addition
                    </div>
                  </td>
                  <td className="py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#FCD2CA]" />
                      <span className="font-semibold">00</span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Settlements
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#8BDECE]" />
                      <span className="font-semibold">00</span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Exclusion
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-2xs bg-[#E2BBED]" />
                      <span className="font-semibold">00</span>
                    </div>
                    <div className="text-[11px] text-[#5A6A7C] pl-3.5">
                      Separation
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Column 3: Payroll Controls (Exact 5 Interactive Toggles) */}
          <div className="md:col-span-4 pl-6 flex flex-col justify-center">
            <div className="space-y-4 text-xs">
              {/* Control 1: Payroll Inputs Lock/Unlock */}
              <div className="flex items-center justify-between">
                <span className="text-[#5A6A7C]">Payroll Inputs</span>
                <div className="inline-flex rounded shadow-2xs border border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollInputsLocked(false);
                      showToast("Payroll inputs unlocked");
                    }}
                    className={`px-3 py-1 transition ${
                      !payrollInputsLocked
                        ? "bg-[#3557CA] text-white font-semibold rounded-l"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollInputsLocked(true);
                      showToast("Payroll inputs locked");
                    }}
                    className={`px-3 py-1 transition ${
                      payrollInputsLocked
                        ? "bg-[#3557CA] text-white font-semibold rounded-r"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Lock
                  </button>
                </div>
              </div>

              {/* Control 2: Employee View Release/Hold */}
              <div className="flex items-center justify-between">
                <span className="text-[#5A6A7C]">Employee View Release</span>
                <div className="inline-flex rounded shadow-2xs border border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeViewReleased(true);
                      showToast("Employee payslip view released");
                    }}
                    className={`px-3 py-1 transition ${
                      employeeViewReleased
                        ? "bg-[#3557CA] text-white font-semibold rounded-l"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeViewReleased(false);
                      showToast("Employee payslip view placed on hold");
                    }}
                    className={`px-3 py-1 transition ${
                      !employeeViewReleased
                        ? "bg-[#3557CA] text-white font-semibold rounded-r"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Hold
                  </button>
                </div>
              </div>

              {/* Control 3: Update Payslips Link */}
              <div className="flex items-center justify-between">
                <span className="text-[#5A6A7C]">
                  Update Payslips With Revised Employee Information
                </span>
                <button
                  type="button"
                  onClick={() =>
                    showToast("Payslips updated with revised employee data")
                  }
                  className="text-xs font-bold text-[#0d6efd] hover:underline"
                >
                  Update
                </button>
              </div>

              {/* Control 4: IT Statement Employee View Release/Hold */}
              <div className="flex items-center justify-between">
                <span className="text-[#5A6A7C]">
                  IT Statement Employee View
                </span>
                <div className="inline-flex rounded shadow-2xs border border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      setItStatementReleased(true);
                      showToast("IT Statement released to employee portal");
                    }}
                    className={`px-3 py-1 transition ${
                      itStatementReleased
                        ? "bg-[#3557CA] text-white font-semibold rounded-l"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Release
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItStatementReleased(false);
                      showToast("IT Statement employee view held");
                    }}
                    className={`px-3 py-1 transition ${
                      !itStatementReleased
                        ? "bg-[#3557CA] text-white font-semibold rounded-r"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Hold
                  </button>
                </div>
              </div>

              {/* Control 5: Final Payroll Lock/Unlock */}
              <div className="flex items-center justify-between">
                <span className="text-[#5A6A7C]">Payroll</span>
                <div className="inline-flex rounded shadow-2xs border border-[#CBD5E1]">
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollLocked(false);
                      showToast("Payroll unlocked for reprocessing");
                    }}
                    className={`px-3 py-1 transition ${
                      !payrollLocked
                        ? "bg-[#3557CA] text-white font-semibold rounded-l"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Unlock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayrollLocked(true);
                      showToast("Payroll locked successfully");
                    }}
                    className={`px-3 py-1 transition ${
                      payrollLocked
                        ? "bg-[#3557CA] text-white font-semibold rounded-r"
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Lock
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Lower 6-Card Operational Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Negative Salary */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Negative Salary
            </h4>
            <div className="flex-1 flex items-center justify-center text-xs text-[#7F8FA4]">
              No Records
            </div>
          </div>

          {/* Card 2: Hold Salary Payout */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Hold Salary Payout
            </h4>
            <div className="flex-1 flex items-center justify-center text-xs text-[#7F8FA4]">
              No Records
            </div>
          </div>

          {/* Card 3: Stop Salary Processing */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Stop Salary Processing
            </h4>
            <div className="flex-1 flex items-center justify-center text-xs text-[#7F8FA4]">
              No Records
            </div>
          </div>

          {/* Card 4: Payout Pending */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Payout Pending
            </h4>
            <div className="pt-2 space-y-2 text-xs">
              <div className="flex items-baseline justify-between border-b border-slate-50 pb-1.5">
                <span className="text-[12px] text-[#5A6A7C]">
                  Bank Transfer(Net Pay)
                </span>
                <span className="text-base font-bold text-[#0d6efd]">31</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] text-[#5A6A7C]">Cash</span>
                <span className="text-base font-bold text-[#0d6efd]">2</span>
              </div>
            </div>
          </div>

          {/* Card 5: Settled Employees */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Settled Employees
            </h4>
            <div className="flex-1 flex items-center justify-center text-xs text-[#7F8FA4]">
              No Records
            </div>
          </div>

          {/* Card 6: Locations Without PT State */}
          <div className="rounded border border-[#E4E9F0] bg-white p-4 shadow-2xs min-h-[140px] flex flex-col">
            <h4 className="text-xs font-semibold text-[#5A6A7C] border-b border-[#F0F2F5] pb-2">
              Locations Without PT State
            </h4>
            <div className="flex-1 flex items-center justify-center text-xs text-[#7F8FA4]">
              No Records
            </div>
          </div>
        </div>
      </main>

      {/* 7. Floating Purple "What's New!" Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() =>
            showToast("What's New: Payroll November 2026 release updates")
          }
          className="flex items-center gap-1.5 rounded-full bg-[#9333EA] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#7E22CE] transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          What&apos;s New!
        </button>
      </div>
    </div>
  );
}
