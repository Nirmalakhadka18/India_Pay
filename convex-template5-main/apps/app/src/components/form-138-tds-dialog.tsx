"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@v1/ui/dialog";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Info,
  Loader2,
  Plus,
  Receipt,
  Scale,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Form138TdsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuarter?: "Q1" | "Q2" | "Q3" | "Q4";
  defaultFinancialYear?: string;
}

export function Form138TdsDialog({
  open,
  onOpenChange,
  defaultQuarter = "Q2",
  defaultFinancialYear = "2026-27",
}: Form138TdsDialogProps) {
  const { current: workspaceId } = useWorkspace();
  const [financialYear, setFinancialYear] = useState(defaultFinancialYear);
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">(
    defaultQuarter,
  );
  const [activeTab, setActiveTab] = useState<
    "summary" | "challans" | "deductees" | "raw"
  >("summary");
  const [isCopied, setIsCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // New Challan Form state
  const [showAddChallan, setShowAddChallan] = useState(false);
  const [bsrCode, setBsrCode] = useState("");
  const [depositDate, setDepositDate] = useState("");
  const [challanSerialNumber, setChallanSerialNumber] = useState("");
  const [minorHead, setMinorHead] = useState<"200" | "400">("200");
  const [taxAmount, setTaxAmount] = useState<number | "">("");
  const [cess, setCess] = useState<number | "">("");
  const [interest, setInterest] = useState<number | "">("");
  const [fee, setFee] = useState<number | "">("");
  const [remarks, setRemarks] = useState("");
  const [isSavingChallan, setIsSavingChallan] = useState(false);

  // Query preview
  const preview = useQuery(
    api.form138Tds.previewQuarterlyTds,
    workspaceId
      ? {
          workspaceId,
          financialYear,
          quarter,
        }
      : "skip",
  );

  const saveChallan = useMutation(api.form138Tds.saveTdsChallan);
  const deleteChallan = useMutation(api.form138Tds.deleteTdsChallan);
  const logExportDownload = useMutation(api.form138Tds.logTdsExportDownload);

  const handleAddChallanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;

    if (!/^\d{7}$/.test(bsrCode.trim())) {
      toast.error("BSR Code must be exactly 7 numeric digits");
      return;
    }
    if (!/^\d{5}$/.test(challanSerialNumber.trim())) {
      toast.error("Challan Serial Number must be exactly 5 numeric digits");
      return;
    }
    if (!depositDate) {
      toast.error("Please enter a valid deposit date");
      return;
    }
    const numTax = Number(taxAmount);
    if (Number.isNaN(numTax) || numTax <= 0) {
      toast.error("Please enter a valid positive TDS amount");
      return;
    }

    setIsSavingChallan(true);
    try {
      await saveChallan({
        workspaceId,
        financialYear,
        quarter,
        bsrCode: bsrCode.trim(),
        depositDate,
        challanSerialNumber: challanSerialNumber.trim(),
        minorHead,
        taxAmount: numTax,
        cess: cess ? Number(cess) : undefined,
        interest: interest ? Number(interest) : undefined,
        fee: fee ? Number(fee) : undefined,
        remarks: remarks.trim() || undefined,
      });

      toast.success("ITNS 281 deposit challan recorded successfully");
      setShowAddChallan(false);
      // Reset form
      setBsrCode("");
      setDepositDate("");
      setChallanSerialNumber("");
      setTaxAmount("");
      setCess("");
      setInterest("");
      setFee("");
      setRemarks("");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save challan",
      );
    } finally {
      setIsSavingChallan(false);
    }
  };

  const handleDeleteChallan = async (challanId: Id<"tdsChallans">) => {
    if (!workspaceId) return;
    try {
      await deleteChallan({ workspaceId, challanId });
      toast.success("Challan record removed");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete challan",
      );
    }
  };

  const handleDownloadFilingFile = async () => {
    if (!preview?.fileContent || !preview?.fileName || !workspaceId) return;

    setIsDownloading(true);
    try {
      const draftFileName = `DRAFT_INTERNAL_${preview.fileName}`;
      const blob = new Blob([preview.fileContent], {
        type: "text/plain;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = draftFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logExportDownload({
        workspaceId,
        formType: `${preview.formName} (Draft Internal Preview)`,
        financialYear,
        quarter,
        totalDeductees: preview.totalDeductees,
        totalTds: preview.totalTdsDeducted,
      });

      toast.info(
        `Draft layout downloaded (${draftFileName}). Official FVU upload disabled until full 60+ field Protean schema certification.`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to download draft text file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadCsvAudit = async () => {
    if (!preview?.csvContent || !preview?.csvFileName || !workspaceId) return;

    try {
      const blob = new Blob([preview.csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = preview.csvFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await logExportDownload({
        workspaceId,
        formType: "CSV Internal Audit",
        financialYear,
        quarter,
        totalDeductees: preview.totalDeductees,
        totalTds: preview.totalTdsDeducted,
      });

      toast.success(
        `Internal audit worksheet downloaded: ${preview.csvFileName}`,
      );
    } catch {
      toast.error("Failed to download CSV audit worksheet");
    }
  };

  const handleCopyRaw = async () => {
    if (!preview?.fileContent) return;
    try {
      await navigator.clipboard.writeText(preview.fileContent);
      setIsCopied(true);
      toast.success("ASCII caret text file copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy content");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Quarterly Salary-TDS Compliance
                  </DialogTitle>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                      preview?.isForm138
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {preview?.formName ??
                      (financialYear.startsWith("2026")
                        ? "Form 138"
                        : "Form 24Q")}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                    Draft Preview Only
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {preview?.isForm138
                    ? "Income-tax Act, 2025 (Section 397(3)(b) / Sec 392, Nature Code: 1002)"
                    : "Income-tax Act, 1961 (Section 200(3) / Sec 192, Nature Code: 92B)"}
                </p>
              </div>
            </div>

            {/* Quarter and Fiscal Year Controls */}
            <div className="flex items-center gap-2">
              <select
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="2026-27">FY 2026-27 (Form 138)</option>
                <option value="2025-26">FY 2025-26 (Form 24Q)</option>
              </select>

              <div className="flex rounded-md border border-input bg-muted/40 p-0.5 text-xs font-medium">
                {(["Q1", "Q2", "Q3", "Q4"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuarter(q)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      quarter === q
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="mt-4 space-y-6">
          {/* Statutory Filing Notice: Official FVU Upload Disabled */}
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                Statutory Compliance Notice: Draft Internal Layout (Official FVU
                Upload Disabled)
              </span>
            </div>
            <p className="mt-1 leading-relaxed text-[11.5px]">
              Direct e-filing upload via the Income Tax portal requires official
              validation through Protean&apos;s{" "}
              <strong>{preview?.fvuVersionRequired ?? "e-TDS/TCS FVU"}</strong>.
              That official specification expects the complete ~60-field Batch
              Header, ~25-field Challan, and ~40-field Deductee structure with
              registered PAO/DDO and postal address blocks. Direct official
              filing upload is disabled to prevent portal rejection. Use the
              verified <strong>Audit Report (.csv)</strong> for payroll
              accounting and audit reconciliation.
            </p>
          </div>
          {/* Actionable Alerts & Validation Errors */}
          {preview?.errors && preview.errors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/20 text-xs">
              <div className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
                <ShieldAlert className="h-4 w-4" />
                <span>Statutory Validation Errors Block Official Filing</span>
              </div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-red-700 dark:text-red-400">
                {preview.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
              <div className="mt-2.5 text-[11px] text-red-600 dark:text-red-400 font-medium">
                Go to <span className="underline">Compliance Settings</span>{" "}
                &rarr; Enter 10-character TAN (e.g. BLRK12345A) and Employer PAN
                to resolve.
              </div>
            </div>
          )}

          {preview?.warnings && preview.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs">
              <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>Compliance Warnings & Advisory Discrepancies</span>
              </div>
              <ul className="mt-1.5 list-disc pl-5 space-y-1 text-amber-700 dark:text-amber-400">
                {preview.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg border border-border bg-card shadow-sm">
              <span className="text-xs text-muted-foreground block">
                Enrolled Deductees
              </span>
              <span className="text-xl font-bold mt-1 block">
                {preview?.totalDeductees ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                {preview?.quarterLabel}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card shadow-sm">
              <span className="text-xs text-muted-foreground block">
                Total Gross Wages
              </span>
              <span className="text-xl font-bold mt-1 block">
                ₹{preview?.totalGrossSalary.toLocaleString("en-IN") ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Across quarter runs
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-card shadow-sm">
              <span className="text-xs text-muted-foreground block">
                Total TDS Deducted
              </span>
              <span className="text-xl font-bold mt-1 block text-indigo-600 dark:text-indigo-400">
                ₹{preview?.totalTdsDeducted.toLocaleString("en-IN") ?? 0}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Section {preview?.sectionCode}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-lg border shadow-sm ${
                (preview?.reconciliationShortfall ?? 0) > 0
                  ? "border-amber-300 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20"
                  : "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
              }`}
            >
              <span className="text-xs font-semibold block text-muted-foreground">
                Challan Deposited
              </span>
              <span className="text-xl font-bold mt-1 block">
                ₹
                {preview?.totalChallanTaxDeposited.toLocaleString("en-IN") ?? 0}
              </span>
              <span
                className={`text-[10px] font-semibold mt-0.5 block ${
                  (preview?.reconciliationShortfall ?? 0) > 0
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {(preview?.reconciliationShortfall ?? 0) > 0
                  ? `Shortfall: ₹${preview?.reconciliationShortfall.toLocaleString("en-IN")}`
                  : "Fully Reconciled"}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("summary")}
              className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "summary"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scale className="h-4 w-4" />
              Reconciliation Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("challans")}
              className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "challans"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Receipt className="h-4 w-4" />
              ITNS 281 Challans ({preview?.totalChallans ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("deductees")}
              className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "deductees"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="h-4 w-4" />
              Deductee Records ({preview?.totalDeductees ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`pb-2.5 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "raw"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Raw ^ File Preview
            </button>
          </div>

          {/* TAB 1: SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4 bg-card/60 text-xs space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                  Deductor & Statement Metadata
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Deductor TAN:
                    </span>
                    <span className="font-mono font-bold">
                      {preview?.tan ?? "Not Configured"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Employer PAN:
                    </span>
                    <span className="font-mono font-bold">
                      {preview?.employerPan || "Not Configured"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Assessment Year:
                    </span>
                    <span className="font-semibold">
                      {preview?.assessmentYear}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Statutory Form:
                    </span>
                    <span className="font-semibold">{preview?.formName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Salary Section Code:
                    </span>
                    <span className="font-mono font-bold text-indigo-600">
                      {preview?.sectionCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">
                      Filing Quarter:
                    </span>
                    <span className="font-semibold">
                      {preview?.quarterLabel}
                    </span>
                  </div>
                </div>
              </div>

              {quarter === "Q4" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
                    <FileCheck2 className="h-4 w-4" />
                    <span>
                      Quarter 4 Mandate: Annexure II Comprehensive Salary
                      Statement Active
                    </span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                    Under statutory guidelines, Q4 filing includes{" "}
                    <strong>Record Type SD (Annexure II)</strong> detailing
                    employee-wise annual gross salary, Section 16 standard
                    deduction (₹75,000 for New Regime / ₹50,000 for Old Regime),
                    Chapter VI-A deductions, net taxable income, and full-year
                    tax liability.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHALLANS */}
          {activeTab === "challans" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">
                    ITNS 281 Tax Deposit Challans
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Record Type CD in {preview?.formName}. Every rupee of
                    deducted TDS must be mapped to a valid deposit challan.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddChallan(!showAddChallan)}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {showAddChallan ? "Cancel" : "Add Deposit Challan"}
                </Button>
              </div>

              {showAddChallan && (
                <form
                  onSubmit={handleAddChallanSubmit}
                  className="rounded-lg border border-border bg-card p-4 space-y-3 text-xs"
                >
                  <div className="font-semibold text-sm border-b pb-2">
                    Record ITNS 281 Deposit Challan
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        BSR Code (7 Digits)*
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 0210001"
                        maxLength={7}
                        value={bsrCode}
                        onChange={(e) =>
                          setBsrCode(e.target.value.replace(/\D/g, ""))
                        }
                        required
                        className="w-full h-8 px-2.5 rounded border border-input bg-background font-mono text-xs focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Challan Serial No (5 Digits)*
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 00123"
                        maxLength={5}
                        value={challanSerialNumber}
                        onChange={(e) =>
                          setChallanSerialNumber(
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        required
                        className="w-full h-8 px-2.5 rounded border border-input bg-background font-mono text-xs focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Deposit Date (DD/MM/YYYY)*
                      </label>
                      <input
                        type="date"
                        value={depositDate}
                        onChange={(e) => setDepositDate(e.target.value)}
                        required
                        className="w-full h-8 px-2.5 rounded border border-input bg-background text-xs focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Minor Head Code*
                      </label>
                      <select
                        value={minorHead}
                        onChange={(e) =>
                          setMinorHead(e.target.value as "200" | "400")
                        }
                        className="w-full h-8 px-2 rounded border border-input bg-background text-xs focus:ring-1 focus:ring-ring"
                      >
                        <option value="200">
                          200 - TDS Payable by Taxpayer
                        </option>
                        <option value="400">400 - Regular Assessment</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        TDS Tax Amount (₹)*
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={taxAmount}
                        onChange={(e) =>
                          setTaxAmount(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        required
                        className="w-full h-8 px-2.5 rounded border border-input bg-background text-xs focus:ring-1 focus:ring-ring font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Cess / Surcharge (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={cess}
                        onChange={(e) =>
                          setCess(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className="w-full h-8 px-2.5 rounded border border-input bg-background text-xs focus:ring-1 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-muted-foreground mb-1">
                        Interest / Fee 234E (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        min={0}
                        value={fee}
                        onChange={(e) =>
                          setFee(
                            e.target.value === "" ? "" : Number(e.target.value),
                          )
                        }
                        className="w-full h-8 px-2.5 rounded border border-input bg-background text-xs focus:ring-1 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddChallan(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSavingChallan}
                      className="h-8 text-xs font-semibold"
                    >
                      {isSavingChallan ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        "Save Challan"
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Challans Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">BSR Code</th>
                      <th className="px-3 py-2.5">Challan Serial</th>
                      <th className="px-3 py-2.5">Deposit Date</th>
                      <th className="px-3 py-2.5">Minor Head</th>
                      <th className="px-3 py-2.5 text-right">TDS (₹)</th>
                      <th className="px-3 py-2.5 text-right">
                        Total Remittance (₹)
                      </th>
                      <th className="px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {preview?.challans && preview.challans.length > 0 ? (
                      preview.challans.map((ch) => (
                        <tr key={ch._id} className="hover:bg-muted/30">
                          <td className="px-3 py-2.5 font-mono font-medium">
                            {ch.bsrCode}
                          </td>
                          <td className="px-3 py-2.5 font-mono font-medium">
                            {ch.challanSerialNumber}
                          </td>
                          <td className="px-3 py-2.5">{ch.depositDate}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono text-[10px]">
                              {ch.minorHead}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold">
                            ₹{ch.taxAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{ch.totalAmount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteChallan(ch._id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              title="Delete Challan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No ITNS 281 deposit challans recorded for {quarter}{" "}
                          {financialYear}. Click &quot;Add Deposit Challan&quot;
                          to link bank tax deposits.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DEDUCTEE RECORDS */}
          {activeTab === "deductees" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm">
                  Monthly Deductee Breakdown (Annexure I)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Record Type DD in {preview?.formName}. Mapped under Section{" "}
                  {preview?.sectionCode}.
                </p>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Employee Name</th>
                      <th className="px-3 py-2.5">PAN</th>
                      <th className="px-3 py-2.5">Wage Month</th>
                      <th className="px-3 py-2.5">Payment Date</th>
                      <th className="px-3 py-2.5">Tax Regime</th>
                      <th className="px-3 py-2.5 text-right">Gross (₹)</th>
                      <th className="px-3 py-2.5 text-right">TDS (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {preview?.monthlyDeductees &&
                    preview.monthlyDeductees.length > 0 ? (
                      preview.monthlyDeductees.map((d, idx) => (
                        <tr
                          key={`${d.employeeId}-${d.periodMonth}-${idx}`}
                          className="hover:bg-muted/30"
                        >
                          <td className="px-3 py-2.5 font-medium">
                            {d.employeeName}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                                d.isPanMissing
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              {d.pan}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            {d.periodMonth}
                          </td>
                          <td className="px-3 py-2.5">{d.paymentDate}</td>
                          <td className="px-3 py-2.5 uppercase font-medium">
                            {d.regime}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium">
                            ₹{d.grossSalary.toLocaleString("en-IN")}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            ₹{d.tdsDeducted.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-muted-foreground"
                        >
                          No processed payroll runs found for {quarter}{" "}
                          {financialYear}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: RAW CARET FILE */}
          {activeTab === "raw" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">
                    Draft Caret-Delimited (^) ASCII Text Preview
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {preview?.fileName} &bull; Internal reconciliation preview
                    &bull; Official FVU upload disabled
                  </p>
                </div>
                {preview?.fileContent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyRaw}
                    className="h-8 gap-1.5 text-xs font-medium"
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {isCopied ? "Copied" : "Copy ASCII File"}
                  </Button>
                )}
              </div>

              {preview?.fileContent ? (
                <div className="relative rounded-lg border border-border bg-muted/30 p-4 font-mono text-[11px] leading-relaxed max-h-72 overflow-x-auto overflow-y-auto">
                  <pre className="whitespace-pre">{preview.fileContent}</pre>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
                  Statutory ASCII file preview is disabled until all critical
                  validation errors above are resolved.
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="border-t border-border pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                Format:{" "}
                <strong className="text-foreground">
                  {preview?.formName} (Draft)
                </strong>{" "}
                &bull; Separator:{" "}
                <code className="text-primary font-bold">^</code> &bull;{" "}
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Official FVU upload disabled
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCsvAudit}
                disabled={!preview?.csvContent}
                className="h-9 gap-1.5 text-xs font-semibold flex-1 sm:flex-none border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Download Audit Report (.csv)
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadFilingFile}
                disabled={!preview?.fileContent || isDownloading}
                className="h-9 gap-1.5 text-xs font-semibold flex-1 sm:flex-none"
                title="Internal draft preview. Direct FVU portal upload is disabled."
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download Draft Preview (.txt)
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
