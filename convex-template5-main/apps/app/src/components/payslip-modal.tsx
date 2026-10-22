"use client";

import {
  type PayslipData,
  downloadPayslipPdf,
  formatIndianCurrency,
  numberToIndianWords,
} from "@/lib/payslip-pdf";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import { useState } from "react";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: PayslipData | null | undefined;
  isLoading?: boolean;
}

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
    const m = months[monthNum - 1];
    if (m) return `${m} ${year}`;
  }
  return period;
}

export function PayslipModal({
  open,
  onOpenChange,
  payslip,
  isLoading = false,
}: PayslipModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = () => {
    if (!payslip) return;
    setIsDownloading(true);
    try {
      downloadPayslipPdf(payslip);
    } catch (e) {
      console.error("PDF download failed:", e);
    } finally {
      setTimeout(() => setIsDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!open) return null;

  // Filter applicable deductions only
  const applicableStatutoryDeductions =
    payslip?.statutoryDeductions?.filter((d) => d.amount > 0) || [];
  const applicableCustomDeductions =
    payslip?.customDeductions?.filter((d) => d.amount > 0) || [];
  const applicableEmployerContributions =
    payslip?.employerContributions?.filter((c) => c.amount > 0) || [];

  const totalEmployerContr =
    payslip?.totalEmployerContributions ??
    applicableEmployerContributions.reduce((sum, c) => sum + c.amount, 0);

  const totalCTC =
    payslip?.totalCostToCompany ??
    (payslip?.grossSalary ?? 0) + totalEmployerContr;

  const inWords =
    payslip?.netPayInWords ||
    (payslip ? numberToIndianWords(payslip.netSalary) : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg font-semibold">
                Payslip Preview
              </DialogTitle>
            </div>
            {payslip && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isDownloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloading ? "Generating..." : "Download PDF"}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {isLoading || !payslip ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3 text-primary/60" />
            <p className="text-sm">Loading finalized payslip data...</p>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-white text-slate-900 rounded-lg border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none payslip-print-area font-sans text-xs">
            {/* Header: Logo Badge & Company Details */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-300">
              {/* Logo block */}
              <div className="bg-[#fbdb2a] border border-slate-800 px-4 py-2 text-center rounded font-extrabold tracking-wider text-slate-900 text-sm">
                VICTOR CHASEX
              </div>
              {/* Company Name & Address */}
              <div className="text-center sm:text-right flex-1">
                <h1 className="text-base font-bold uppercase tracking-wide text-slate-900">
                  {payslip.workspaceName || "VICTOR CHASEX PRIVATE LIMITED"}
                </h1>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  {payslip.companyAddress ||
                    "2ND AND 3RD FLOOR, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU"}
                </p>
              </div>
            </div>

            {/* Payslip Month Title */}
            <div className="text-center py-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Payslip for the month of{" "}
                {formatPeriodMonth(payslip.periodMonth)}
              </h2>
            </div>

            {/* Employee Meta Grid (2-column bordered card) */}
            <div className="border border-slate-300 grid grid-cols-1 sm:grid-cols-2 text-xs">
              {/* Left Column */}
              <div className="p-3 sm:border-r border-slate-300 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Name:</span>
                  <span className="font-bold text-slate-900">
                    {payslip.employeeName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Joining Date:
                  </span>
                  <span className="text-slate-800">
                    {payslip.joiningDate || "01 Sep 2026"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Designation:
                  </span>
                  <span className="text-slate-800">
                    {payslip.designation || "Staff"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Department:
                  </span>
                  <span className="text-slate-800">
                    {payslip.department || "General"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Location:</span>
                  <span className="text-slate-800">
                    {payslip.location || "Bangalore"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Effective Work Days:
                  </span>
                  <span className="text-slate-800 font-semibold">
                    {payslip.effectiveWorkDays ??
                      Math.max(0, 30 - (payslip.lopDays || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">LOP:</span>
                  <span
                    className={`font-semibold ${payslip.lopDays > 0 ? "text-rose-600" : "text-slate-800"}`}
                  >
                    {payslip.lopDays || 0}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="p-3 space-y-1.5 border-t sm:border-t-0 border-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Employee No:
                  </span>
                  <span className="font-mono text-slate-800">
                    {payslip.employeeNo || payslip.employeeId || "NH-OL-578"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bank Name:</span>
                  <span className="text-slate-800">
                    {payslip.bankName || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    Bank Account No:
                  </span>
                  <span className="font-mono text-slate-800">
                    {payslip.maskedBankAccountNumber ||
                      (payslip.bankAccountNumber
                        ? `••••${payslip.bankAccountNumber.slice(-4)}`
                        : "—")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">
                    PAN Number:
                  </span>
                  <span className="font-mono text-slate-800">
                    {payslip.pan || payslip.maskedPan || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">PF No:</span>
                  <span className="font-mono text-slate-800">
                    {payslip.pfMemberId || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">PF UAN:</span>
                  <span className="font-mono text-slate-800">
                    {payslip.uan || payslip.maskedUan || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">ESI IP No:</span>
                  <span className="font-mono text-slate-800">
                    {payslip.esicIpNumber || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="mt-4 border border-slate-300 grid grid-cols-1 sm:grid-cols-2 text-xs">
              {/* Earnings Column */}
              <div className="sm:border-r border-slate-300 flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 flex justify-between border-b border-slate-300">
                    <span className="w-1/2">Earnings</span>
                    <span className="w-1/4 text-right">Master</span>
                    <span className="w-1/4 text-right">Amount</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex justify-between text-slate-700">
                      <span className="w-1/2 font-medium">BASIC</span>
                      <span className="w-1/4 text-right text-slate-600">
                        ₹
                        {formatIndianCurrency(
                          payslip.masterBasicSalary ?? payslip.basicSalary,
                        )}
                      </span>
                      <span className="w-1/4 text-right font-medium text-slate-900">
                        ₹{formatIndianCurrency(payslip.basicSalary)}
                      </span>
                    </div>
                    {payslip.allowances?.map((a) => (
                      <div
                        key={a.name}
                        className="flex justify-between text-slate-700"
                      >
                        <span className="w-1/2 font-medium">
                          {a.name.toUpperCase()}
                        </span>
                        <span className="w-1/4 text-right text-slate-600">
                          ₹{formatIndianCurrency(a.masterAmount ?? a.amount)}
                        </span>
                        <span className="w-1/4 text-right font-medium text-slate-900">
                          ₹{formatIndianCurrency(a.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-900 flex justify-between border-t border-slate-300">
                  <span className="w-1/2">Total Earnings</span>
                  <span className="w-1/4 text-right">
                    ₹
                    {formatIndianCurrency(
                      payslip.masterGrossSalary ?? payslip.grossSalary,
                    )}
                  </span>
                  <span className="w-1/4 text-right text-emerald-700">
                    ₹{formatIndianCurrency(payslip.grossSalary)}
                  </span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="flex flex-col justify-between border-t sm:border-t-0 border-slate-300">
                <div>
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 flex justify-between border-b border-slate-300">
                    <span className="w-3/4">Deductions</span>
                    <span className="w-1/4 text-right">Amount</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    {payslip.lopDeduction > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span className="w-3/4">LOSS OF PAY (LOP)</span>
                        <span className="w-1/4 text-right">
                          ₹{formatIndianCurrency(payslip.lopDeduction)}
                        </span>
                      </div>
                    )}
                    {applicableStatutoryDeductions.map((d) => (
                      <div
                        key={d.name}
                        className="flex justify-between text-slate-700"
                      >
                        <span className="w-3/4 font-medium">
                          {d.name.toUpperCase()}
                        </span>
                        <span className="w-1/4 text-right font-medium text-slate-900">
                          ₹{formatIndianCurrency(d.amount)}
                        </span>
                      </div>
                    ))}
                    {applicableCustomDeductions.map((d) => (
                      <div
                        key={d.name}
                        className="flex justify-between text-slate-700"
                      >
                        <span className="w-3/4 font-medium">
                          {d.name.toUpperCase()}
                        </span>
                        <span className="w-1/4 text-right font-medium text-slate-900">
                          ₹{formatIndianCurrency(d.amount)}
                        </span>
                      </div>
                    ))}
                    {deductionsListLength(payslip) === 0 && (
                      <p className="text-slate-400 italic py-2 text-center">
                        No employee deductions applicable for this period.
                      </p>
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-900 flex justify-between border-t border-slate-300">
                  <span className="w-3/4">Total Deductions</span>
                  <span className="w-1/4 text-right text-rose-700">
                    ₹{formatIndianCurrency(payslip.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable Card & Amount in Words */}
            <div className="mt-3 p-3.5 border border-slate-300 bg-slate-50 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide block">
                  Net Pay for the Month
                </span>
                <span className="text-[11px] text-slate-600 italic">
                  ({inWords})
                </span>
              </div>
              <div className="text-xl font-bold text-emerald-700">
                ₹{formatIndianCurrency(payslip.netSalary)}
              </div>
            </div>

            {/* Employer Statutory Contributions (Separate Section) */}
            <div className="mt-4 border border-slate-300 rounded overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 border-b border-slate-300">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Employer Statutory Contributions (Not Deducted from Employee
                  Net Pay)
                </h3>
                <p className="text-[10px] text-slate-500">
                  Statutory benefits contributed by employer directly to
                  authorities; separate from employee salary.
                </p>
              </div>

              {applicableEmployerContributions.length > 0 ? (
                <div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {applicableEmployerContributions.map((c) => (
                      <div
                        key={c.name}
                        className="border border-slate-200 p-2 rounded bg-slate-50/50"
                      >
                        <span className="text-slate-500 block text-[10px] font-medium">
                          {c.name.toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹{formatIndianCurrency(c.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 px-3 py-2 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center text-xs font-bold gap-2">
                    <span className="text-slate-700">
                      Total Employer Contribution:{" "}
                      <span className="text-slate-900">
                        ₹{formatIndianCurrency(totalEmployerContr)}
                      </span>
                    </span>
                    <span className="text-slate-700">
                      Total Cost to Company (CTC):{" "}
                      <span className="text-emerald-800">
                        ₹{formatIndianCurrency(totalCTC)}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 text-center text-slate-500 text-xs italic bg-slate-50/50">
                  No employer statutory contributions applicable for this
                  employee profile.
                </div>
              )}
            </div>

            {/* System Generated Footer & Print Date */}
            <div className="mt-6 pt-3 border-t border-slate-300 text-center text-[10px] text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">
                This is a system generated payslip and does not require
                signature.
              </p>
              <div className="flex justify-between items-center text-[9px] text-slate-400 pt-1">
                <span>
                  Print Date: {payslip.printDate || "19 Oct 2026, 04:39 PM"}
                </span>
                <span>IndiaPay Statutory Payroll System</span>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .payslip-print-area, .payslip-print-area * {
              visibility: visible;
            }
            .payslip-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

function deductionsListLength(payslip: PayslipData): number {
  let count = 0;
  if (payslip.lopDeduction > 0) count++;
  count += payslip.statutoryDeductions?.filter((d) => d.amount > 0).length || 0;
  count += payslip.customDeductions?.filter((d) => d.amount > 0).length || 0;
  return count;
}
