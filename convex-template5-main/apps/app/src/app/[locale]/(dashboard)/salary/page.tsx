"use client";

import { GreytHRIcon } from "@/components/greythr-icon";
import {
  type PayslipData,
  downloadPayslipPdf,
  formatIndianCurrency,
  numberToIndianWords,
} from "@/lib/payslip-pdf";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function formatPeriodMonth(period: string): string {
  if (!period) return "";
  const parts = period.split("-");
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = Number.parseInt(parts[1] ?? "1", 10);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = months[monthNum - 1] ?? "Period";
    return `${monthName} ${year}`;
  }
  return period;
}

export default function PayslipsPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const myPayslips = useQuery(api.payroll.getMyPayslips, scoped);

  const [activeTab, setActiveTab] = useState<"payslip" | "reimb">("payslip");
  const [selectedRunId, setSelectedRunId] = useState<string>("");
  const [showEmpDetails, setShowEmpDetails] = useState<boolean>(true);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Real finalized payslip runs for authenticated employee
  const runs = useMemo(() => {
    return myPayslips ?? [];
  }, [myPayslips]);

  const currentRun = useMemo(() => {
    if (!runs.length) return null;
    if (selectedRunId) {
      return runs.find((r) => r.payrollRunId === selectedRunId) ?? runs[0];
    }
    return runs[0];
  }, [runs, selectedRunId]);

  // Query actual payslip details if a finalized run exists
  const payslipDetail = useQuery(
    api.payroll.getPayslip,
    workspaceId && me && currentRun
      ? {
          workspaceId,
          payrollRunId: currentRun.payrollRunId as Id<"payrollRuns">,
          employeeId: me._id as Id<"employees">,
        }
      : "skip",
  );

  const handleDownload = () => {
    if (!currentRun) {
      toast.error("Please select a finalized payroll period.");
      return;
    }
    if (!payslipDetail) {
      toast.error("Payslip details are not available for this period.");
      return;
    }
    setIsDownloading(true);
    try {
      const data: PayslipData = {
        workspaceName: payslipDetail.workspaceName,
        companyAddress: payslipDetail.companyAddress,
        location: payslipDetail.location,
        periodMonth: currentRun.periodMonth,
        startDate: payslipDetail.startDate,
        endDate: payslipDetail.endDate,
        paymentDate: currentRun.finalizedAt,
        employeeName: payslipDetail.employeeName,
        employeeNo: payslipDetail.employeeNo,
        joiningDate: payslipDetail.joiningDate,
        department: payslipDetail.department,
        designation: payslipDetail.designation,
        email: payslipDetail.email,
        phone: payslipDetail.phone,
        bankName: payslipDetail.bankName,
        bankAccountNumber: payslipDetail.bankAccountNumber,
        maskedBankAccountNumber: payslipDetail.maskedBankAccountNumber,
        ifscCode: payslipDetail.ifscCode,
        pan: payslipDetail.pan,
        maskedPan: payslipDetail.maskedPan,
        uan: payslipDetail.uan,
        maskedUan: payslipDetail.maskedUan,
        pfMemberId: payslipDetail.pfMemberId,
        esicIpNumber: payslipDetail.esicIpNumber,
        effectiveWorkDays: payslipDetail.effectiveWorkDays,
        totalWorkingDays: payslipDetail.totalWorkingDays,
        basicSalary: payslipDetail.basicSalary,
        masterBasicSalary: payslipDetail.masterBasicSalary,
        allowances: payslipDetail.allowances ?? [],
        grossSalary: currentRun.grossSalary,
        masterGrossSalary: payslipDetail.masterGrossSalary,
        lopDays: payslipDetail.lopDays ?? 0,
        lopDeduction: payslipDetail.lopDeduction ?? 0,
        customDeductions: payslipDetail.customDeductions ?? [],
        totalCustomDeductions: payslipDetail.totalCustomDeductions ?? 0,
        statutoryDeductions: payslipDetail.statutoryDeductions ?? [],
        totalStatutoryDeductions: payslipDetail.totalStatutoryDeductions ?? 0,
        employerContributions: payslipDetail.employerContributions ?? [],
        totalEmployerContributions: payslipDetail.totalEmployerContributions ?? 0,
        totalDeductions: currentRun.totalDeductions,
        netSalary: currentRun.netSalary,
        netPayInWords: payslipDetail.netPayInWords,
      };
      downloadPayslipPdf(data);
    } finally {
      setIsDownloading(false);
    }
  };

  // Deductions compilation
  const deductionRows = useMemo(() => {
    if (!payslipDetail) return [];
    const rows: { name: string; amount: number }[] = [];

    if (payslipDetail.statutoryDeductions) {
      for (const d of payslipDetail.statutoryDeductions) {
        if (d.amount > 0) {
          let name = d.name.toUpperCase();
          if (name.includes("PROVIDENT") || name.includes("PF")) {
            name = "PF";
          } else if (name.includes("PROFESSIONAL") || name.includes("PT")) {
            name = "PROF TAX";
          }
          rows.push({ name, amount: d.amount });
        }
      }
    }

    if (payslipDetail.customDeductions) {
      for (const d of payslipDetail.customDeductions) {
        if (d.amount > 0) {
          rows.push({ name: d.name.toUpperCase(), amount: d.amount });
        }
      }
    }

    if (payslipDetail.lopDeduction && payslipDetail.lopDeduction > 0) {
      rows.push({
        name: `LOSS OF PAY (${payslipDetail.lopDays || 0} DAYS)`,
        amount: payslipDetail.lopDeduction,
      });
    }

    if (payslipDetail.employerContributions) {
      for (const c of payslipDetail.employerContributions) {
        if (c.amount > 0) {
          rows.push({
            name: c.name.toUpperCase().replace("CONTRIBUTION", "CON"),
            amount: c.amount,
          });
        }
      }
    }

    return rows;
  }, [payslipDetail]);

  const periodFormatted = currentRun
    ? formatPeriodMonth(currentRun.periodMonth)
    : "Sep 2026";

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F9FAFB] dark:bg-black">
      {/* Top Controls Area */}
      <div className="border-b border-border/80 bg-card px-6 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left Heading */}
          <div className="flex items-center gap-3">
            <GreytHRIcon className="h-5 w-5 shrink-0" />
            <h1 className="text-base font-semibold text-primary">Payslips</h1>
          </div>

          {/* Center Tabs */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-md shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab("payslip")}
                className={`rounded-l-md px-6 py-1.5 text-xs font-semibold transition ${
                  activeTab === "payslip"
                    ? "bg-[#0091FF] text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300"
                }`}
              >
                Payslip
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reimb")}
                className={`rounded-r-md border border-l-0 border-gray-200 px-6 py-1.5 text-xs font-semibold transition dark:border-border ${
                  activeTab === "reimb"
                    ? "border-[#0091FF] bg-[#0091FF] text-white shadow-xs"
                    : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-card dark:text-gray-300"
                }`}
              >
                Reimb. Payslip
              </button>
            </div>
          </div>

          {/* Right Download & Period Dropdown matching user screenshot */}
          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span className="text-[11px] uppercase tracking-wider text-gray-500">SELECT PERIOD:</span>
              <select
                value={currentRun?.payrollRunId ?? ""}
                onChange={(e) => setSelectedRunId(e.target.value)}
                className="h-8 rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
              >
                {runs.map((r) => (
                  <option key={r._id} value={r.payrollRunId}>
                    {r.periodMonth} (Finalized)
                  </option>
                ))}
                {!runs.length && <option value="">No released payroll</option>}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || !currentRun || !payslipDetail}
              title="Download Payslip"
              className="flex h-8 items-center gap-1.5 rounded border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 shadow-2xs transition hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border dark:bg-card dark:text-gray-200"
            >
              {isDownloading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
              )}
              <span>{isDownloading ? "Downloading…" : "Download Payslip"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-6 md:p-8">
        {!workspaceId ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#0091FF]" />
          </div>
        ) : activeTab === "payslip" && runs.length > 0 && currentRun && payslipDetail ? (
          <div className="flex w-full flex-col gap-6">
            {/* Victor Chasex Payslip Header Card */}
            <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-4 rounded-md border border-gray-200 bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
              <div className="flex items-center gap-4">
                <img
                  src="/victor-chasex-logo.jpg"
                  alt="VICTOR CHASEX"
                  className="h-9 w-auto rounded object-contain shadow-2xs"
                />
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                    Victor Chasex Private Limited
                  </h2>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    2ND AND 3RD FLOOR, L-149, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU,
                  </p>
                </div>
              </div>
              <div className="text-right sm:self-center">
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Payslip for the month of {periodFormatted}
                </span>
              </div>
            </div>

            <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
              {/* Left 62%: Side-by-Side Earnings and Deductions */}
              <div className="flex w-full flex-col items-stretch gap-4 md:flex-row lg:w-[62%]">
                {/* Earnings Table */}
                <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xs dark:border-border dark:bg-card">
                  {/* Table Header */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-[#E9F5FD] px-4 py-2.5 dark:border-border dark:bg-sky-950/40">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Earnings
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Amount in (₹)
                  </span>
                </div>

                {/* Rows */}
                <div className="flex flex-1 flex-col">
                  {/* Basic */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 text-xs text-gray-700 dark:border-border/60 dark:text-gray-300">
                    <span>BASIC</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {(payslipDetail.basicSalary ?? 0).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {/* Allowances */}
                  {payslipDetail.allowances?.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 text-xs text-gray-700 dark:border-border/60 dark:text-gray-300"
                    >
                      <span>{a.name.toUpperCase()}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {a.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs font-bold text-gray-900 dark:border-border dark:bg-muted/40 dark:text-white">
                  <span>Total</span>
                  <span>
                    {(currentRun.grossSalary ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="flex flex-1 flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xs dark:border-border dark:bg-card">
                {/* Table Header */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-[#E9F5FD] px-4 py-2.5 dark:border-border dark:bg-sky-950/40">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Deductions
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Amount in (₹)
                  </span>
                </div>

                {/* Rows */}
                <div className="flex flex-1 flex-col">
                  {deductionRows.map((d, idx) => (
                    <div
                      key={`${d.name}-${idx}`}
                      className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 text-xs text-gray-700 dark:border-border/60 dark:text-gray-300"
                    >
                      <span>{d.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {d.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Total Row */}
                <div className="mt-auto flex items-center justify-between border-t border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs font-bold text-gray-900 dark:border-border dark:bg-muted/40 dark:text-white">
                  <span>Total</span>
                  <span>
                    {(currentRun.totalDeductions ?? 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 38%: Employee Details Card + Net Pay Card */}
            <div className="flex w-full flex-col gap-4 lg:w-[38%]">
              {/* Employee Details Card (Cream background) */}
              <div className="rounded-md border border-[#FFF9C4] bg-[#FFFDE7] p-4 shadow-2xs dark:border-amber-900/30 dark:bg-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Employee details
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEmpDetails(!showEmpDetails)}
                    className="cursor-pointer text-xs font-semibold text-[#0091FF] hover:underline focus:outline-none"
                  >
                    {showEmpDetails ? "Hide" : "Show"}
                  </button>
                </div>

                {showEmpDetails && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-amber-200/60 pt-3 dark:border-amber-800/40">
                    {/* Column 1 */}
                    <div>
                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Name
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.employeeName}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Designation
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.designation}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Department
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.department}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Location
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.location || "Bangalore"}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Effective Work Days
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.effectiveWorkDays ?? 30}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        LOP
                      </span>
                      <span className="block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {(payslipDetail.lopDays ?? 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Column 2 */}
                    <div>
                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Employee No
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.employeeNo}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Bank Name
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.bankName || "State Bank of India"}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        Bank Account No
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.maskedBankAccountNumber ||
                          (payslipDetail.bankAccountNumber
                            ? `••••${payslipDetail.bankAccountNumber.slice(-4)}`
                            : "—")}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        PAN Number
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.maskedPan || payslipDetail.pan || "—"}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        PF No
                      </span>
                      <span className="mb-2 block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.pfMemberId || "—"}
                      </span>

                      <span className="block text-[11px] font-normal text-gray-400 dark:text-gray-400">
                        PF UAN
                      </span>
                      <span className="block text-xs font-medium text-gray-800 dark:text-gray-200">
                        {payslipDetail.maskedUan || payslipDetail.uan || "—"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Net Pay Card */}
              <div className="rounded-md border border-gray-200 bg-white p-4 shadow-2xs dark:border-border dark:bg-card">
                <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Net Pay for {periodFormatted}
                </span>
                <span className="mt-1 block text-2xl font-bold tracking-tight text-[#16A34A]">
                  ₹
                  {(currentRun.netSalary ?? 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="mt-1 block text-[11px] italic leading-snug text-gray-500 dark:text-gray-400">
                  {payslipDetail.netPayInWords ||
                    numberToIndianWords(currentRun.netSalary)}
                </span>
              </div>
            </div>
          </div>
        </div>
        ) : activeTab === "reimb" ? (
          /* Reimbursement Payslip Empty State */
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-center shadow-2xs dark:border-border dark:bg-card">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#0091FF] dark:bg-blue-950/40">
              <GreytHRIcon className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
              No Reimbursement Payslips Found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Reimbursement payslips will show up here once claims for {periodFormatted} are approved and released.
            </p>
          </div>
        ) : (
          /* General Empty State for Payslip */
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-10 text-center shadow-2xs dark:border-border dark:bg-card">
            <div className="relative mb-3 flex items-center justify-center">
              <svg
                width="200"
                height="130"
                viewBox="0 0 240 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="select-none"
                aria-hidden="true"
              >
                <g transform="translate(60, 20)">
                  <rect
                    x="0"
                    y="0"
                    width="80"
                    height="70"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                  />
                  <rect x="6" y="6" width="68" height="58" rx="3" fill="#F8FAFC" />
                  <circle cx="40" cy="30" r="11" fill="#E2E8F0" />
                  <path
                    d="M24 54C24 46 31 43 40 43C49 43 56 46 56 54"
                    fill="#E2E8F0"
                  />
                </g>
                <g transform="translate(100, 35)">
                  <rect
                    x="0"
                    y="0"
                    width="80"
                    height="85"
                    rx="6"
                    fill="#FFFFFF"
                    stroke="#CBD5E1"
                    strokeWidth="2.5"
                  />
                  <path d="M0 24H80" stroke="#E2E8F0" strokeWidth="2" />
                  <rect x="0" y="0" width="80" height="24" rx="6" fill="#0091FF" />
                  <circle cx="20" cy="12" r="3" fill="#FFFFFF" />
                  <circle cx="60" cy="12" r="3" fill="#FFFFFF" />
                  <rect x="14" y="38" width="52" height="6" rx="2" fill="#E2E8F0" />
                  <rect x="14" y="52" width="40" height="6" rx="2" fill="#F1F5F9" />
                  <rect x="14" y="66" width="48" height="6" rx="2" fill="#F1F5F9" />
                </g>
              </svg>
            </div>
            <p className="max-w-md text-xs font-medium text-gray-600 dark:text-gray-300">
              Uh oh! Your Payslip will show up here after the release of Payroll.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-10 pb-4 text-center text-[11px] text-muted-foreground">
          main-2544 | Privacy Policy | Terms Of Service
        </div>
      </div>
    </div>
  );
}
