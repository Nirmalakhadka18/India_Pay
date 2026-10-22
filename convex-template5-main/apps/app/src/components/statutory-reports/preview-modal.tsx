"use client";

import {
  downloadEsiMonthlyUploadExcel,
  downloadPfEcrExcel,
  downloadPfEcrTxt,
} from "@/lib/statutory-excel";
import {
  downloadEsiChallanReportPdf,
  downloadEsiMonthlyStatementPdf,
  downloadKarnatakaForm5APdf,
  downloadPfCombinedChallanReportPdf,
  downloadPfMonthlyStatementPdf,
  downloadPtMonthlyStatementPdf,
  formatINR,
} from "@/lib/statutory-pdf";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import type {
  EsiEmployeeRecordType,
  EsiReportDataResponse,
  GenericStatutoryRecord,
  PfEmployeeRecordType,
  PfReportDataResponse,
  PtEmployeeRecordType,
  PtReportDataResponse,
  PtSlabRecordType,
} from "./types";

export type StatutoryReportId =
  | "esi_monthly_statement"
  | "esi_challan"
  | "esi_upload_excel"
  | "pf_monthly_statement"
  | "pf_combined_challan"
  | "pf_ecr"
  | "pt_monthly_statement"
  | "karnataka_form_5a";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportId: StatutoryReportId | null;
  periodMonth: string;
  state: string;
  esiData?: EsiReportDataResponse | null;
  pfData?: PfReportDataResponse | null;
  ptData?: PtReportDataResponse | null;
}

export function StatutoryReportPreviewModal({
  open,
  onOpenChange,
  reportId,
  periodMonth,
  state,
  esiData,
  pfData,
  ptData,
}: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"table" | "txt">("table");

  if (!reportId) return null;

  const isEsi = reportId.startsWith("esi_");
  const isPf = reportId.startsWith("pf_");
  const isPt = reportId.startsWith("pt_") || reportId === "karnataka_form_5a";

  const currentData = isEsi ? esiData : isPf ? pfData : ptData;
  const isDraft = currentData?.isDraft ?? true;
  const isFinalized = currentData?.isFinalized ?? false;
  const reconciliation = currentData?.reconciliation;

  const getReportTitle = () => {
    switch (reportId) {
      case "esi_monthly_statement":
        return "ESI Monthly Statement (PDF)";
      case "esi_challan":
        return "ESI Challan Report (PDF)";
      case "esi_upload_excel":
        return "ESI Monthly Report Upload Format (Excel)";
      case "pf_monthly_statement":
        return "PF Monthly Statement (PDF)";
      case "pf_combined_challan":
        return "PF Combined Challan Report V1 (PDF)";
      case "pf_ecr":
        return "PF ECR Format (TXT & Excel)";
      case "pt_monthly_statement":
        return `Profession Tax Monthly Statement — ${state} (PDF)`;
      case "karnataka_form_5a":
        return "Karnataka Form 5A Monthly Statement (PDF)";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = (formatOverride?: "txt" | "excel") => {
    switch (reportId) {
      case "esi_monthly_statement":
        if (!esiData) return;
        downloadEsiMonthlyStatementPdf({
          workspaceName: esiData.workspaceName,
          companyAddress: esiData.companyAddress,
          periodMonth,
          isDraft,
          totalWages: esiData.totalWages,
          totalEmployeeContribution: esiData.totalEmployeeContribution,
          totalEmployerContribution: esiData.totalEmployerContribution,
          totalContribution: esiData.totalContribution,
          portalEmployerContribution: esiData.portalEmployerContribution,
          portalTotalContribution: esiData.portalTotalContribution,
          records: esiData.records,
        });
        break;
      case "esi_challan":
        if (!esiData) return;
        downloadEsiChallanReportPdf({
          workspaceName: esiData.workspaceName,
          companyAddress: esiData.companyAddress,
          periodMonth,
          isDraft,
          totalEmployees: esiData.totalEmployeesCovered,
          totalWages: esiData.totalWages,
          employeeContribution: esiData.totalEmployeeContribution,
          employerContribution: esiData.totalEmployerContribution,
          totalAmount: esiData.totalContribution,
          amountInWords: esiData.amountInWords,
        });
        break;
      case "esi_upload_excel":
        if (!esiData) return;
        downloadEsiMonthlyUploadExcel(
          esiData.records.map((r: EsiEmployeeRecordType) => ({
            insuranceNo: r.insuranceNo,
            name: r.name,
            daysWorked: r.daysWorked,
            totalMonthlyWages: r.esiGross,
            reasonCode: r.reasonCode,
            lastWorkingDay: r.lastWorkingDay,
          })),
          periodMonth,
          isDraft,
        );
        break;
      case "pf_monthly_statement":
        if (!pfData) return;
        downloadPfMonthlyStatementPdf({
          workspaceName: pfData.workspaceName,
          companyAddress: pfData.companyAddress,
          periodMonth,
          isDraft,
          totalEpfWages: pfData.totalEpfWages,
          totalEeShare: pfData.totalEeShare,
          totalErPf: pfData.totalErShare,
          totalErEps: pfData.totalEpsShare,
          accountBreakdown: pfData.accountBreakdown,
          records: pfData.records,
        });
        break;
      case "pf_combined_challan":
        if (!pfData) return;
        downloadPfCombinedChallanReportPdf({
          workspaceName: pfData.workspaceName,
          companyAddress: pfData.companyAddress,
          periodMonth,
          establishmentCode: pfData.establishmentCode,
          isDraft,
          totalSubscribers: pfData.totalMembers,
          totalWagesDue: pfData.totalEpfWages,
          ac1_ee: pfData.accountBreakdown.ac1_ee,
          ac1_er: pfData.accountBreakdown.ac1_er,
          ac2_admin: pfData.accountBreakdown.ac2_admin,
          ac10_eps: pfData.accountBreakdown.ac10_eps,
          ac21_edli: pfData.accountBreakdown.ac21_edli,
          totalRemittance: pfData.accountBreakdown.totalRemittance,
          amountInWords: pfData.accountBreakdown.amountInWords,
        });
        break;
      case "pf_ecr":
        if (!pfData) return;
        if (formatOverride === "excel") {
          downloadPfEcrExcel(
            pfData.workspaceName,
            pfData.companyAddress,
            pfData.records.map((r: PfEmployeeRecordType) => ({
              slNo: r.slNo,
              employeeNo: r.employeeNo,
              name: r.name,
              uan: r.uan,
              grossWages: r.grossWages,
              epfWages: r.epfWages,
              epsWages: r.epsWages,
              edliWages: r.edliWages,
              eeShare: r.eePf,
              epsShare: r.erEps,
              erShare: r.erPf,
              ncpDays: r.ncpDays,
              refundOfAdvances: r.refundOfAdvances,
            })),
            periodMonth,
            isDraft,
          );
        } else {
          downloadPfEcrTxt(
            pfData.txtContent,
            periodMonth,
            pfData.establishmentCode,
            isDraft,
          );
        }
        break;
      case "pt_monthly_statement":
        if (!ptData) return;
        downloadPtMonthlyStatementPdf({
          workspaceName: ptData.workspaceName,
          companyAddress: ptData.companyAddress,
          periodMonth,
          state,
          isDraft,
          records: ptData.records,
          slabsSummary: ptData.slabsSummary,
        });
        break;
      case "karnataka_form_5a":
        if (!ptData) return;
        downloadKarnatakaForm5APdf({
          workspaceName: ptData.workspaceName,
          companyAddress: ptData.companyAddress,
          periodMonth,
          isDraft,
          ptoCircleNo: ptData.karnatakaForm5A?.ptoCircleNo,
          registrationCertificateNo:
            ptData.karnatakaForm5A?.registrationCertificateNo,
          totalTax: ptData.totalTaxDeducted,
          amountInWords: ptData.amountInWords,
          records: ptData.records,
          slabs: ptData.slabsSummary,
        });
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg font-semibold">
                  {getReportTitle()}
                </DialogTitle>
                {isDraft ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    DRAFT PREVIEW ONLY
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    FINALIZED & VERIFIED
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Period: {periodMonth} &bull; Entity:{" "}
                {currentData?.workspaceName} &bull; Jurisdiction: {state}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print
              </Button>

              {reportId === "pf_ecr" ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleDownload("txt")}
                    className="h-8 gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                  >
                    <Download className="h-3.5 w-3.5" /> Download TXT
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload("excel")}
                    className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
                  </Button>
                </>
              ) : reportId === "esi_upload_excel" ? (
                <Button
                  size="sm"
                  onClick={() => handleDownload("excel")}
                  className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Download Excel
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleDownload()}
                  className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Reconciliation and Verification Status */}
        {reconciliation && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
              reconciliation.reconciled
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span>
                <strong>Reconciliation Status:</strong>{" "}
                {reconciliation.reconciled
                  ? "Report totals reconcile exactly against backend payroll run records."
                  : `Discrepancy detected: ₹${reconciliation.discrepancy} difference against payroll items.`}
              </span>
            </div>
            <div className="font-mono">
              Report: ₹{formatINR(reconciliation.reportTotal)} &bull; Payroll
              Items: ₹{formatINR(reconciliation.payrollItemsTotal)}
            </div>
          </div>
        )}

        {/* Preview Content Area */}
        {!currentData || !currentData.hasRun ? (
          <div className="py-16 text-center text-muted-foreground">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-2" />
            <h3 className="font-medium text-foreground">
              No Processed Payroll Run
            </h3>
            <p className="text-xs mt-1">
              There is no payroll run calculated or finalized for {periodMonth}.
              Please select a month with payroll activity or run payroll from
              the Payroll engine.
            </p>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Header Document Metadata Card */}
            <div className="p-4 bg-muted/40 rounded-lg border text-xs space-y-1">
              <div className="flex justify-between font-semibold text-foreground text-sm">
                <span>{currentData.workspaceName}</span>
                <span>Period: {periodMonth}</span>
              </div>
              <p className="text-muted-foreground">
                {currentData.companyAddress}
              </p>
              {isPf && pfData?.establishmentCode && (
                <p className="text-muted-foreground">
                  <strong>EPFO Est. Code:</strong> {pfData.establishmentCode}
                </p>
              )}
            </div>

            {/* TAB SELECTOR for PF ECR (Table vs TXT) */}
            {reportId === "pf_ecr" && (
              <div className="flex border-b text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("table")}
                  className={`px-4 py-2 font-medium border-b-2 ${
                    activeTab === "table"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Table / Excel Format
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("txt")}
                  className={`px-4 py-2 font-medium border-b-2 ${
                    activeTab === "txt"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Raw ECR TXT Format (#~#)
                </button>
              </div>
            )}

            {/* RAW TXT PREVIEW FOR PF ECR */}
            {reportId === "pf_ecr" && activeTab === "txt" ? (
              <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-lg overflow-x-auto max-h-96">
                <div className="text-slate-400 border-b border-slate-700 pb-2 mb-2">
                  // Delimited with standard #~# delimiter (11 columns per EPFO
                  ECR 2.0 specification)
                </div>
                <pre>{pfData?.txtContent}</pre>
              </div>
            ) : reportId === "esi_challan" && esiData ? (
              /* DUAL COPY CHALLAN PREVIEW FOR ESI */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "ORIGINAL E.S.I.C. (For Bank)",
                  "DUPLICATE E.S.I.C. (For ESIC)",
                ].map((title) => (
                  <div
                    key={title}
                    className="p-4 border rounded-lg bg-card text-xs space-y-3 shadow-sm"
                  >
                    <div className="border-b pb-2 text-center">
                      <span className="font-bold text-primary">{title}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        EMPLOYEES&apos; STATE INSURANCE FUND, ACCOUNT NO. 1
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        STATE BANK OF INDIA
                      </p>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <p>
                        Paid into credit of ESI Fund A/c No. 1:{" "}
                        <strong className="text-foreground">
                          ₹{formatINR(esiData.totalContribution)}
                        </strong>
                      </p>
                      <p className="italic text-[11px]">
                        ({esiData.amountInWords})
                      </p>
                    </div>

                    <div className="p-2.5 bg-muted/30 rounded border space-y-1">
                      <div className="flex justify-between">
                        <span>No. of Employees:</span>
                        <strong>{esiData.totalEmployeesCovered}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Wages:</span>
                        <strong>₹{formatINR(esiData.totalWages)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Employees&apos; Cont. (0.75%):</span>
                        <strong>
                          ₹{formatINR(esiData.totalEmployeeContribution)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Employers&apos; Cont. (3.25%):</span>
                        <strong>
                          ₹{formatINR(esiData.totalEmployerContribution)}
                        </strong>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold text-foreground">
                        <span>Total Payable:</span>
                        <span className="text-emerald-600">
                          ₹{formatINR(esiData.totalContribution)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : reportId === "pf_combined_challan" && pfData ? (
              /* PF COMBINED CHALLAN PREVIEW */
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded border">
                  <div>
                    <span className="text-muted-foreground">Subscribers:</span>{" "}
                    <strong>{pfData.totalMembers}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Wages Due:</span>{" "}
                    <strong>₹{formatINR(pfData.totalEpfWages)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Total Remittance:
                    </span>{" "}
                    <strong className="text-emerald-600">
                      ₹{formatINR(pfData.accountBreakdown.totalRemittance)}
                    </strong>
                  </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-muted text-muted-foreground font-medium text-[11px]">
                      <tr>
                        <th className="p-2 text-center">Sl</th>
                        <th className="p-2">Particular</th>
                        <th className="p-2 text-right">A/c 1</th>
                        <th className="p-2 text-right">A/c 2</th>
                        <th className="p-2 text-right">A/c 10</th>
                        <th className="p-2 text-right">A/c 21</th>
                        <th className="p-2 text-right">A/c 22</th>
                        <th className="p-2 text-right font-bold">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr>
                        <td className="p-2 text-center">1</td>
                        <td className="p-2 font-medium">
                          Employer&apos;s Share
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac1_er)}
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac10_eps)}
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac21_edli)}
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right font-semibold">
                          ₹
                          {formatINR(
                            pfData.accountBreakdown.ac1_er +
                              pfData.accountBreakdown.ac10_eps +
                              pfData.accountBreakdown.ac21_edli,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-center">2</td>
                        <td className="p-2 font-medium">
                          Employee&apos;s Share
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac1_ee)}
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{formatINR(pfData.accountBreakdown.ac1_ee)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 text-center">3</td>
                        <td className="p-2 font-medium">
                          Admin Charges (0.50%)
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac2_admin)}
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right font-semibold">
                          ₹{formatINR(pfData.accountBreakdown.ac2_admin)}
                        </td>
                      </tr>
                      <tr className="bg-muted/40 font-bold border-t-2">
                        <td className="p-2" colSpan={2}>
                          TOTAL
                        </td>
                        <td className="p-2 text-right">
                          ₹
                          {formatINR(
                            pfData.accountBreakdown.ac1_ee +
                              pfData.accountBreakdown.ac1_er,
                          )}
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac2_admin)}
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac10_eps)}
                        </td>
                        <td className="p-2 text-right">
                          ₹{formatINR(pfData.accountBreakdown.ac21_edli)}
                        </td>
                        <td className="p-2 text-right">₹0.00</td>
                        <td className="p-2 text-right text-emerald-600 text-sm">
                          ₹{formatINR(pfData.accountBreakdown.totalRemittance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="italic text-muted-foreground">
                  Amount in words: {pfData.accountBreakdown.amountInWords}
                </p>
              </div>
            ) : reportId === "karnataka_form_5a" && ptData ? (
              /* KARNATAKA FORM 5A PREVIEW */
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-muted/30 rounded border">
                  <h4 className="font-semibold mb-2">
                    Form 5A Return on Tax Payable (Rule 11A)
                  </h4>
                  <table className="w-full text-left border rounded overflow-hidden">
                    <thead className="bg-muted text-muted-foreground text-[11px]">
                      <tr>
                        <th className="p-2 text-center">Sl</th>
                        <th className="p-2">Salary Slab</th>
                        <th className="p-2 text-right">Employees</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Tax Deducted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ptData.slabsSummary?.map(
                        (s: PtSlabRecordType, idx: number) => (
                          <tr key={s.slabLabel}>
                            <td className="p-2 text-center">{idx + 1}</td>
                            <td className="p-2">{s.slabLabel}</td>
                            <td className="p-2 text-right">
                              {s.employeeCount}
                            </td>
                            <td className="p-2 text-right">
                              ₹{formatINR(s.rate)}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ₹{formatINR(s.amount)}
                            </td>
                          </tr>
                        ),
                      )}
                      <tr className="bg-muted/40 font-bold border-t">
                        <td className="p-2" colSpan={2}>
                          Grand Total
                        </td>
                        <td className="p-2 text-right">
                          {ptData.totalEmployees}
                        </td>
                        <td className="p-2 text-right">-</td>
                        <td className="p-2 text-right text-emerald-600">
                          ₹{formatINR(ptData.totalTaxDeducted)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Annexure Preview */}
                <h4 className="font-semibold">Employee Annexure (Page 2)</h4>
                <div className="border rounded-lg overflow-x-auto max-h-64">
                  <table className="w-full text-left">
                    <thead className="bg-muted text-muted-foreground text-[11px] sticky top-0">
                      <tr>
                        <th className="p-2 text-center">Sl</th>
                        <th className="p-2">Emp No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Join Date</th>
                        <th className="p-2 text-right">Gross Salary</th>
                        <th className="p-2 text-right">Tax Deducted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {ptData.records?.map((r: PtEmployeeRecordType) => (
                        <tr key={r.employeeId}>
                          <td className="p-2 text-center">{r.slNo}</td>
                          <td className="p-2">{r.employeeNo}</td>
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2">{r.joinDate}</td>
                          <td className="p-2 text-right">
                            ₹{formatINR(r.grossSalary)}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            ₹{formatINR(r.ptAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* STANDARD EMPLOYEE TABLE FOR STATEMENTS & EXCEL UPLOAD */
              <div className="border rounded-lg overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground font-medium sticky top-0 text-[11px]">
                    {reportId === "esi_upload_excel" ? (
                      <tr>
                        <th className="p-2">IP Number (10 Digits)</th>
                        <th className="p-2">IP Name</th>
                        <th className="p-2 text-right">Days Worked</th>
                        <th className="p-2 text-right">Monthly Wages</th>
                        <th className="p-2 text-center">Reason Code</th>
                        <th className="p-2 text-center">Last Working Day</th>
                      </tr>
                    ) : reportId === "esi_monthly_statement" ? (
                      <tr>
                        <th className="p-2 text-center">Sl</th>
                        <th className="p-2">Emp No</th>
                        <th className="p-2">Insurance No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2 text-right">Days</th>
                        <th className="p-2 text-right">ESI Gross</th>
                        <th className="p-2 text-right">EE Share (0.75%)</th>
                        <th className="p-2 text-right">ER Share (3.25%)</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    ) : reportId === "pf_monthly_statement" ? (
                      <tr>
                        <th className="p-2 text-center">Sl</th>
                        <th className="p-2">Emp No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">UAN / PF No</th>
                        <th className="p-2 text-right">Basic + DA</th>
                        <th className="p-2 text-right">EE PF (12%)</th>
                        <th className="p-2 text-right">ER PF (3.67%)</th>
                        <th className="p-2 text-right">ER EPS (8.33%)</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    ) : (
                      /* PT monthly statement */
                      <tr>
                        <th className="p-2 text-center">Sr. No.</th>
                        <th className="p-2">Employee No</th>
                        <th className="p-2">Name</th>
                        <th className="p-2 text-right">Prof Tax Basic</th>
                        <th className="p-2 text-right">Tax Deducted</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isEsi ? (
                      esiData?.records?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No eligible employees found for this report.
                          </td>
                        </tr>
                      ) : (
                        esiData?.records?.map((r) => (
                          <tr
                            key={r.employeeId || r.slNo}
                            className="hover:bg-muted/40"
                          >
                            {reportId === "esi_upload_excel" ? (
                              <>
                                <td className="p-2 font-mono">
                                  {r.insuranceNo}
                                </td>
                                <td className="p-2 font-medium">{r.name}</td>
                                <td className="p-2 text-right">
                                  {r.daysWorked}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{formatINR(r.esiGross)}
                                </td>
                                <td className="p-2 text-center">
                                  {r.reasonCode}
                                </td>
                                <td className="p-2 text-center">
                                  {r.lastWorkingDay || "-"}
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-2 text-center">{r.slNo}</td>
                                <td className="p-2">{r.employeeNo}</td>
                                <td className="p-2 font-mono">
                                  {r.insuranceNo}
                                </td>
                                <td className="p-2 font-medium">{r.name}</td>
                                <td className="p-2 text-right">
                                  {r.daysWorked}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{formatINR(r.esiGross)}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{formatINR(r.employeeContribution)}
                                </td>
                                <td className="p-2 text-right">
                                  ₹{formatINR(r.employerContribution)}
                                </td>
                                <td className="p-2 text-right font-semibold">
                                  ₹{formatINR(r.totalContribution)}
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      )
                    ) : reportId === "pf_monthly_statement" ? (
                      pfData?.records?.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No eligible employees found for this report.
                          </td>
                        </tr>
                      ) : (
                        pfData?.records?.map((r) => (
                          <tr
                            key={r.employeeId || r.slNo}
                            className="hover:bg-muted/40"
                          >
                            <td className="p-2 text-center">{r.slNo}</td>
                            <td className="p-2">{r.employeeNo}</td>
                            <td className="p-2 font-medium">{r.name}</td>
                            <td className="p-2 font-mono">{r.uan}</td>
                            <td className="p-2 text-right">
                              ₹{formatINR(r.epfWages)}
                            </td>
                            <td className="p-2 text-right">
                              ₹{formatINR(r.eePf)}
                            </td>
                            <td className="p-2 text-right">
                              ₹{formatINR(r.erPf)}
                            </td>
                            <td className="p-2 text-right">
                              ₹{formatINR(r.erEps)}
                            </td>
                            <td className="p-2 text-right font-semibold">
                              ₹{formatINR(r.erTotal)}
                            </td>
                          </tr>
                        ))
                      )
                    ) : ptData?.records?.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No eligible employees found for this report.
                        </td>
                      </tr>
                    ) : (
                      ptData?.records?.map((r) => (
                        <tr
                          key={r.employeeId || r.slNo}
                          className="hover:bg-muted/40"
                        >
                          <td className="p-2 text-center">{r.slNo}</td>
                          <td className="p-2">{r.employeeNo}</td>
                          <td className="p-2 font-medium">{r.name}</td>
                          <td className="p-2 text-right">
                            ₹{formatINR(r.grossSalary)}
                          </td>
                          <td className="p-2 text-right font-semibold">
                            ₹{formatINR(r.ptAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
