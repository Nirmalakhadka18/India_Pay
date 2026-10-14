"use client";

import {
  type PayslipData,
  downloadPayslipPdf,
  formatIndianCurrency,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
          <div className="p-6 sm:p-8 bg-white text-slate-900 rounded-lg border border-slate-200 shadow-sm print:p-0 print:border-none print:shadow-none payslip-print-area">
            {/* Header Banner */}
            <div className="text-center pb-6 border-b border-slate-200">
              <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">
                {payslip.workspaceName}
              </h1>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mt-1">
                Payslip for {payslip.periodMonth}
              </h2>
              {payslip.paymentDate && (
                <p className="text-xs text-slate-400 mt-1">
                  Payment Date:{" "}
                  {new Date(payslip.paymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>

            {/* Employee Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-100 bg-slate-50/70 -mx-6 px-6 sm:-mx-8 sm:px-8 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">
                  Employee Name
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {payslip.employeeName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Department
                </span>
                <span className="font-semibold text-slate-800">
                  {payslip.department || "General"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Designation
                </span>
                <span className="font-semibold text-slate-800">
                  {payslip.designation || "Staff"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Loss of Pay Days
                </span>
                <span className="font-semibold text-rose-600">
                  {payslip.lopDays || 0} days
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email</span>
                <span className="text-slate-600 truncate block">
                  {payslip.email || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Pay Period
                </span>
                <span className="text-slate-600">
                  {payslip.startDate && payslip.endDate
                    ? `${payslip.startDate} to ${payslip.endDate}`
                    : payslip.periodMonth}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Payment Status
                </span>
                <span className="font-semibold text-emerald-600">
                  Finalized
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">
                  Currency
                </span>
                <span className="text-slate-600 font-medium">INR (₹)</span>
              </div>
            </div>

            {/* Two Column Earnings vs Deductions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 text-xs">
              {/* Earnings */}
              <div className="rounded border border-slate-200 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 flex justify-between border-b border-slate-200">
                    <span>EARNINGS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex justify-between py-1 px-2 text-slate-600">
                      <span>Basic Salary</span>
                      <span className="font-medium text-slate-900">
                        ₹{formatIndianCurrency(payslip.basicSalary)}
                      </span>
                    </div>
                    {payslip.allowances?.map((a) => (
                      <div
                        key={a.name}
                        className="flex justify-between py-1 px-2 text-slate-600 border-t border-slate-50"
                      >
                        <span>{a.name}</span>
                        <span className="font-medium text-slate-900">
                          ₹{formatIndianCurrency(a.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-900 flex justify-between border-t border-slate-200">
                  <span>Gross Earnings</span>
                  <span className="text-emerald-700">
                    ₹{formatIndianCurrency(payslip.grossSalary)}
                  </span>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded border border-slate-200 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 flex justify-between border-b border-slate-200">
                    <span>DEDUCTIONS</span>
                    <span>AMOUNT (₹)</span>
                  </div>
                  <div className="p-2 space-y-1">
                    {payslip.lopDeduction > 0 && (
                      <div className="flex justify-between py-1 px-2 text-rose-600">
                        <span>Loss of Pay (LOP)</span>
                        <span className="font-medium">
                          ₹{formatIndianCurrency(payslip.lopDeduction)}
                        </span>
                      </div>
                    )}
                    {payslip.customDeductions?.map((d) => (
                      <div
                        key={d.name}
                        className="flex justify-between py-1 px-2 text-slate-600 border-t border-slate-50"
                      >
                        <span>{d.name}</span>
                        <span className="font-medium text-slate-900">
                          ₹{formatIndianCurrency(d.amount)}
                        </span>
                      </div>
                    ))}
                    {payslip.statutoryDeductions?.map(
                      (d) =>
                        d.amount > 0 && (
                          <div
                            key={d.name}
                            className="flex justify-between py-1 px-2 text-slate-600 border-t border-slate-50"
                          >
                            <span>{d.name}</span>
                            <span className="font-medium text-slate-900">
                              ₹{formatIndianCurrency(d.amount)}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
                <div className="bg-slate-50 px-3 py-2 font-bold text-slate-900 flex justify-between border-t border-slate-200">
                  <span>Total Deductions</span>
                  <span className="text-rose-700">
                    ₹{formatIndianCurrency(payslip.totalDeductions)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable Card */}
            <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                  Net Salary Payable (Take-Home)
                </span>
                <span className="text-xs text-emerald-600">
                  Transferred via direct bank payout
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-700">
                ₹{formatIndianCurrency(payslip.netSalary)}
              </div>
            </div>

            {/* Informational Employer Contributions */}
            {(payslip.totalEmployerContributions ?? 0) > 0 && (
              <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Informational: Employer Statutory Contributions
                </h3>
                <p className="text-[11px] text-slate-400 mb-3">
                  These statutory benefits are contributed directly by the
                  employer and are not deducted from gross salary.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-100 text-xs">
                  {payslip.employerContributions?.map(
                    (c) =>
                      c.amount > 0 && (
                        <div key={c.name}>
                          <span className="text-slate-400 block text-[10px]">
                            {c.name}
                          </span>
                          <span className="font-semibold text-slate-700">
                            ₹{formatIndianCurrency(c.amount)}
                          </span>
                        </div>
                      ),
                  )}
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">
                      Total Employer Cost
                    </span>
                    <span className="font-bold text-slate-900">
                      ₹
                      {formatIndianCurrency(
                        payslip.totalEmployerContributions ?? 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              <p>
                This is an electronically generated payslip and does not require
                a physical signature.
              </p>
              <p className="mt-0.5">
                Powered by IndiaPay - Indian Payroll Management SaaS
              </p>
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
