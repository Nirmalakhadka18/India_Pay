"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Info,
  Layers,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  downloadEsiChallanReportPdf,
  downloadEsiMonthlyStatementPdf,
  downloadKarnatakaForm5APdf,
  downloadPfCombinedChallanReportPdf,
  downloadPfMonthlyStatementPdf,
  downloadPtMonthlyStatementPdf,
  formatINR,
} from "@/lib/statutory-pdf";
import {
  downloadEsiMonthlyUploadExcel,
  downloadPfEcrExcel,
  downloadPfEcrTxt,
} from "@/lib/statutory-excel";
import {
  type StatutoryReportId,
  StatutoryReportPreviewModal,
} from "./preview-modal";
import type {
  EsiEmployeeRecordType,
  PfEmployeeRecordType,
} from "./types";

interface StatutoryReportsSectionProps {
  initialPeriodMonth?: string;
  runs?: Array<{
    _id: Id<"payrollRuns">;
    periodMonth: string;
    status: string;
    [key: string]: unknown;
  }>;
}

export function StatutoryReportsSection({
  initialPeriodMonth,
  runs = [],
}: StatutoryReportsSectionProps) {
  const { current: workspaceId } = useWorkspace();

  // Find latest period from runs, or fallback to current or initial
  const defaultPeriod =
    initialPeriodMonth ||
    (runs.length > 0 ? (runs[0]?.periodMonth ?? "2026-10") : "2026-10");

  const [periodMonth, setPeriodMonth] = useState<string>(defaultPeriod);

  // Synchronize when runs finish loading from query if no initial period was explicitly passed
  useEffect(() => {
    if (runs && runs.length > 0 && !initialPeriodMonth) {
      const activeRunExists = runs.some((r) => r.periodMonth === periodMonth);
      if (!activeRunExists && runs[0]?.periodMonth) {
        setPeriodMonth(runs[0].periodMonth);
      }
    }
  }, [runs, initialPeriodMonth, periodMonth]);
  const [selectedState, setSelectedState] = useState<string>("Karnataka");
  const [previewReportId, setPreviewReportId] =
    useState<StatutoryReportId | null>(null);

  // Queries for real report data from backend
  const esiData = useQuery(
    api.statutoryReports.getEsiReportData,
    workspaceId ? { workspaceId, periodMonth } : "skip",
  );

  const pfData = useQuery(
    api.statutoryReports.getPfReportData,
    workspaceId ? { workspaceId, periodMonth } : "skip",
  );

  const ptData = useQuery(
    api.statutoryReports.getPtReportData,
    workspaceId ? { workspaceId, periodMonth, state: selectedState } : "skip",
  );

  const logDownload = useMutation(api.statutoryReports.logReportDownload);

  const activeRun = runs.find((r) => r.periodMonth === periodMonth);
  const runStatus = activeRun?.status || (esiData?.hasRun ? esiData.runStatus : "none");
  const isFinalized = runStatus === "processed";

  const handleDownloadDirect = async (
    reportId: StatutoryReportId,
    format: "pdf" | "excel" | "txt" = "pdf",
  ) => {
    if (!workspaceId) return;

    try {
      if (reportId === "esi_monthly_statement" && esiData) {
        downloadEsiMonthlyStatementPdf({
          workspaceName: esiData.workspaceName,
          companyAddress: esiData.companyAddress,
          periodMonth,
          isDraft: !isFinalized,
          totalWages: esiData.totalWages,
          totalEmployeeContribution: esiData.totalEmployeeContribution,
          totalEmployerContribution: esiData.totalEmployerContribution,
          totalContribution: esiData.totalContribution,
          portalEmployerContribution: esiData.portalEmployerContribution,
          portalTotalContribution: esiData.portalTotalContribution,
          records: esiData.records,
        });
        toast.success("Downloaded ESI Monthly Statement (PDF)");
      } else if (reportId === "esi_challan" && esiData) {
        downloadEsiChallanReportPdf({
          workspaceName: esiData.workspaceName,
          companyAddress: esiData.companyAddress,
          periodMonth,
          isDraft: !isFinalized,
          totalEmployees: esiData.totalEmployeesCovered,
          totalWages: esiData.totalWages,
          employeeContribution: esiData.totalEmployeeContribution,
          employerContribution: esiData.totalEmployerContribution,
          totalAmount: esiData.totalContribution,
          amountInWords: esiData.amountInWords,
        });
        toast.success("Downloaded ESI Challan Report (PDF)");
      } else if (reportId === "esi_upload_excel" && esiData) {
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
          !isFinalized,
        );
        toast.success("Downloaded ESI Upload Format (Excel)");
      } else if (reportId === "pf_monthly_statement" && pfData) {
        downloadPfMonthlyStatementPdf({
          workspaceName: pfData.workspaceName,
          companyAddress: pfData.companyAddress,
          periodMonth,
          isDraft: !isFinalized,
          totalEpfWages: pfData.totalEpfWages,
          totalEeShare: pfData.totalEeShare,
          totalErPf: pfData.totalErShare,
          totalErEps: pfData.totalEpsShare,
          accountBreakdown: pfData.accountBreakdown,
          records: pfData.records,
        });
        toast.success("Downloaded PF Monthly Statement (PDF)");
      } else if (reportId === "pf_combined_challan" && pfData) {
        downloadPfCombinedChallanReportPdf({
          workspaceName: pfData.workspaceName,
          companyAddress: pfData.companyAddress,
          periodMonth,
          establishmentCode: pfData.establishmentCode,
          isDraft: !isFinalized,
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
        toast.success("Downloaded PF Combined Challan Report V1 (PDF)");
      } else if (reportId === "pf_ecr" && pfData) {
        if (format === "excel") {
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
            !isFinalized,
          );
          toast.success("Downloaded PF ECR Format (Excel)");
        } else {
          downloadPfEcrTxt(
            pfData.txtContent,
            periodMonth,
            pfData.establishmentCode,
            !isFinalized,
          );
          toast.success("Downloaded PF ECR Format (TXT)");
        }
      } else if (reportId === "pt_monthly_statement" && ptData) {
        downloadPtMonthlyStatementPdf({
          workspaceName: ptData.workspaceName,
          companyAddress: ptData.companyAddress,
          periodMonth,
          state: selectedState,
          isDraft: !isFinalized,
          records: ptData.records,
          slabsSummary: ptData.slabsSummary,
        });
        toast.success(`Downloaded PT Statement for ${selectedState} (PDF)`);
      } else if (reportId === "karnataka_form_5a" && ptData) {
        downloadKarnatakaForm5APdf({
          workspaceName: ptData.workspaceName,
          companyAddress: ptData.companyAddress,
          periodMonth,
          isDraft: !isFinalized,
          ptoCircleNo: ptData.karnatakaForm5A?.ptoCircleNo,
          registrationCertificateNo:
            ptData.karnatakaForm5A?.registrationCertificateNo,
          totalTax: ptData.totalTaxDeducted,
          amountInWords: ptData.amountInWords,
          records: ptData.records,
          slabs: ptData.slabsSummary,
        });
        toast.success("Downloaded Karnataka Form 5A (PDF)");
      }

      await logDownload({
        workspaceId,
        reportType: reportId,
        periodMonth,
        recordCount:
          (reportId.startsWith("esi_")
            ? esiData?.records?.length
            : reportId.startsWith("pf_")
              ? pfData?.records?.length
              : ptData?.records?.length) || 0,
        format,
      });
    } catch (e) {
      console.error(e);
      const err = e as Error;
      toast.error(`Download failed: ${err?.message || "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-border/80">
      {/* Statutory Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <h2 className="text-base font-semibold text-foreground">
              Statutory Compliance Reports
            </h2>
            {isFinalized ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-3 w-3" /> Processed Run
              </span>
            ) : runStatus !== "none" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <Info className="h-3 w-3" /> Draft Preview Only
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                No Run in Period
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Download standard statutory filing statements, challans, and upload formats for ESI, PF, and Professional Tax.
          </p>
        </div>

        {/* Month and State Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-lg border text-xs">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Month:</span>
            <input
              type="month"
              value={periodMonth}
              onChange={(e) => e.target.value && setPeriodMonth(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1.5 rounded-lg border text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">PT State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer"
            >
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Telangana">Telangana</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="West Bengal">West Bengal</option>
              <option value="Delhi">Delhi (Nil PT)</option>
              <option value="Haryana">Haryana (Nil PT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Informative banner when viewing period with no payroll run */}
      {runStatus === "none" && (
        <div className="flex items-center gap-2 p-3 bg-muted/40 border border-border/80 rounded-lg text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-sky-500 shrink-0" />
          <span>
            No payroll run found for <strong>{periodMonth}</strong>. Statutory figures reflect ₹0.00 until a payroll run is processed for this month.
            {runs.length > 0 && (
              <>
                {" "}Switch to an existing run:{" "}
                {runs.map((r) => (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => setPeriodMonth(r.periodMonth)}
                    className="underline font-semibold text-foreground hover:text-sky-600 mr-2"
                  >
                    {r.periodMonth} ({r.status})
                  </button>
                ))}
              </>
            )}
          </span>
        </div>
      )}

      {/* 3 Statutory Cards Grid matching reference UI screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* CARD 1: ESI — Employees' State Insurance */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#0284c7] px-4 py-3 text-white flex items-center gap-2.5 shadow-inner">
            <div className="p-1.5 bg-white/10 rounded">
              <FileSpreadsheet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                ESI - EMPLOYEES&apos; STATE INSURANCE FUND
              </h3>
              <p className="text-[11px] text-white/80">
                {esiData?.totalEmployeesCovered || 0} covered &bull; ₹{formatINR(esiData?.totalContribution || 0)} total
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 flex-1">
            {/* Report 1: ESI Monthly Statement */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    ESI Monthly Statement
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Detailed contribution register by insured person
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("esi_monthly_statement")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("esi_monthly_statement", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Report 2: ESI Challan Report */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    ESI Challan Report
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Bank & ESIC dual-copy pay-in-slip for A/c 1
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("esi_challan")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("esi_challan", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Report 3: ESI Monthly Report Upload Format */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    EXCEL
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    ESI Monthly Report Upload Format
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  ESIC Portal standard 6-column upload spreadsheet
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("esi_upload_excel")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("esi_upload_excel", "excel")}
                  className="h-7 px-2 text-xs gap-1 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                  title="Download Excel"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: PF — Provident Fund */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#0f766e] px-4 py-3 text-white flex items-center gap-2.5 shadow-inner">
            <div className="p-1.5 bg-white/10 rounded">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                PF - PROVIDENT FUND
              </h3>
              <p className="text-[11px] text-white/80">
                {pfData?.totalMembers || 0} members &bull; ₹{formatINR(pfData?.accountBreakdown?.totalRemittance || 0)} remittance
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 flex-1">
            {/* Report 4: PF Monthly Statement */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    PF Monthly Statement
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  EPF, VPF, EPS breakdowns and A/c 1/2/10/21/22 audit
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("pf_monthly_statement")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("pf_monthly_statement", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Report 5: PF Combined Challan Report V1 */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    PF Combined Challan Report V1
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  SBI 5-Account remittance challan with amount in words
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("pf_combined_challan")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("pf_combined_challan", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-teal-300 dark:border-teal-800 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Report 6: PF ECR Format (TXT and Excel) */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    TXT
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    XLS
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    PF ECR Format
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  EPFO Portal #~# delimited text & 13-column Excel return
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("pf_ecr")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("pf_ecr", "txt")}
                  className="h-7 px-1.5 text-[11px] border-slate-300 dark:border-slate-700 hover:bg-muted"
                  title="Download TXT (#~# delimited)"
                >
                  TXT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("pf_ecr", "excel")}
                  className="h-7 px-1.5 text-[11px] border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold"
                  title="Download Excel"
                >
                  XLS
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: PT — Professional Tax */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#4338ca] px-4 py-3 text-white flex items-center gap-2.5 shadow-inner">
            <div className="p-1.5 bg-white/10 rounded">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">
                PT - PROFESSION TAX
              </h3>
              <p className="text-[11px] text-white/80">
                {selectedState} &bull; {ptData?.totalEmployees || 0} employees &bull; ₹{formatINR(ptData?.totalTaxDeducted || 0)} tax
              </p>
            </div>
          </div>

          <div className="divide-y divide-border/60 flex-1">
            {/* Report 7: Professional Tax Monthly Statement (Any State) */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    PT Monthly Statement (Any State)
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Multi-state schedule statement with slab rate summary
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("pt_monthly_statement")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("pt_monthly_statement", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Report 8: Karnataka Form 5A Monthly Statement */}
            <div className="p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    PDF
                  </span>
                  <p className="text-xs font-semibold text-foreground truncate">
                    Karnataka Form 5A Monthly Statement
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Rule 11A statutory return of tax payable & employee annexure
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewReportId("karnataka_form_5a")}
                  className="h-7 px-2 text-xs gap-1 text-primary"
                  title="Generate Preview"
                >
                  <Eye className="h-3.5 w-3.5" /> Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadDirect("karnataka_form_5a", "pdf")}
                  className="h-7 px-2 text-xs gap-1 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  title="Download PDF"
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Modal for Generate Preview */}
      <StatutoryReportPreviewModal
        open={Boolean(previewReportId)}
        onOpenChange={(open) => !open && setPreviewReportId(null)}
        reportId={previewReportId}
        periodMonth={periodMonth}
        state={selectedState}
        esiData={esiData}
        pfData={pfData}
        ptData={ptData}
      />
    </div>
  );
}
