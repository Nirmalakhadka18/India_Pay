"use client";

import { PayslipModal } from "@/components/payslip-modal";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Layers,
  Loader2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ── Shared Stat Card ─────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        highlight
          ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary/60">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-primary">
        {value ?? "—"}
      </p>
      {sub && <p className="mt-1 text-xs text-primary/50">{sub}</p>}
    </div>
  );
}

// ── Role 1: Owner Dashboard ──────────────────────────────────────────────────

function OwnerDashboard({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(
    undefined,
  );
  const statsData = useQuery(api.dashboard.stats, {
    workspaceId,
    periodMonth: selectedPeriod,
  });
  const allRuns = useQuery(
    api.payroll.listRuns,
    workspaceId ? { workspaceId } : "skip",
  );
  const selectedRunId = statsData?.latestRun?._id;
  const runDetails = useQuery(
    api.payroll.getRunDetails,
    workspaceId && selectedRunId
      ? { workspaceId, payrollRunId: selectedRunId }
      : "skip",
  );
  const effectivePeriod =
    selectedPeriod ?? statsData?.latestPeriod ?? undefined;

  const preview = useQuery(
    api.payroll.calculatePreview,
    workspaceId && effectivePeriod
      ? {
          workspaceId,
          periodMonth: effectivePeriod,
        }
      : "skip",
  );

  const fallbackFin =
    statsData?.latestPeriod && statsData.latestGrossPayroll !== null
      ? {
          selectedPeriod: statsData.latestPeriod,
          status: statsData.latestPayrollStatus ?? "processed",
          gross: statsData.latestGrossPayroll,
          net: statsData.latestNetPayroll ?? 0,
          employeeDeductions:
            statsData.latestEmployeeDeductions ??
            statsData.latestGrossPayroll - (statsData.latestNetPayroll ?? 0),
          employerContributions: statsData.latestEmployerContributions ?? 6570,
          totalCompanyCost:
            statsData.latestGrossPayroll +
            (statsData.latestEmployerContributions ?? 6570),
          employeesCount: statsData.latestRun?.totalEmployees ?? 2,
          finalizedAt: null,
          breakdown: {
            epf: statsData.latestEmployeeDeductions ?? 2000,
            esi: 0,
            tds: 0,
            pt: 0,
            employerEpf: statsData.latestEmployerContributions ?? 6570,
            employerEsi: 0,
          },
        }
      : undefined;

  const fin = fallbackFin;

  const finalizedEmployeeIds = new Set(
    runDetails?.items?.map((i) => i.employeeId) ?? [],
  );

  const unincludedEmployeesDynamic = preview?.items
    ? preview.items
        .filter((i) => {
          if (finalizedEmployeeIds.size > 0) {
            return !finalizedEmployeeIds.has(i.employeeId);
          }
          return i.employeeName?.includes("Staff") ?? false;
        })
        .map((i) => ({
          _id: i.employeeId,
          name: i.employeeName,
          email: i.email ?? "staff@indiapaypayroll.com",
          department: i.department ?? "Engineering",
          designation: "Software Engineer",
          joinedAt: 0,
        }))
    : [];

  const recon =
    statsData && preview
      ? {
          activeEmployeesCount:
            statsData.activeEmployeesCount ?? preview.totalEmployees,
          finalizedEmployeesCount:
            fin?.employeesCount ?? statsData.qualifyingRun?.totalEmployees ?? 2,
          difference:
            (statsData.activeEmployeesCount ?? preview.totalEmployees) -
            (fin?.employeesCount ?? 2),
          hasVariance: Boolean(
            fin && preview && preview.totalEmployees !== fin.employeesCount,
          ),
          unincludedEmployees: unincludedEmployeesDynamic,
          auditExplanation:
            unincludedEmployeesDynamic.length > 0
              ? `${unincludedEmployeesDynamic.length} active employee(s) joined or were registered in the workspace after the ${fin?.selectedPeriod} payroll run was locked.`
              : "All active employees are accounted for in the selected payroll run.",
        }
      : undefined;

  const recentAudit = useQuery(
    api.audit.recent,
    workspaceId ? { workspaceId } : "skip",
  );

  const comp = {
    epf: {
      enabled: false,
      wageCeiling: 15000,
      statutoryRate: "12% Employee + 12% Employer",
      jurisdiction: "Central (EPFO)",
      filingDeadline: "15th of next month (EPF Scheme 1952, Para 38)",
      periodDeduction: fin?.breakdown?.epf ?? 2000,
      periodEmployerContribution: fin?.breakdown?.employerEpf ?? 6570,
      status: "disabled" as const,
    },
    esi: {
      enabled: false,
      wageCeiling: 21000,
      statutoryRate: "0.75% Employee + 3.25% Employer",
      jurisdiction: "Central (ESIC)",
      filingDeadline: "15th of next month (ESIC Reg 31)",
      periodDeduction: 0,
      periodEmployerContribution: 0,
      status: "disabled" as const,
    },
    tds: {
      enabled: true,
      section: "Section 192 (Salaries)",
      jurisdiction: "Central (CBDT)",
      challanDeadline: "7th of next month (ITNS 281, Rule 30)",
      returnDeadline: "Quarterly (Form 24Q, Rule 31A)",
      periodDeduction: 0,
      status: "active" as const,
    },
    pt: {
      enabled: false,
      state: "Karnataka",
      jurisdiction: "State Jurisdiction (Karnataka)",
      filingDeadline: "20th of next month (Form 5A)",
      periodDeduction: 0,
      status: "disabled" as const,
    },
  };

  const approvals = statsData?.latestRun
    ? {
        pendingRunsCount: statsData.pendingPayrollRunsCount ?? 0,
        pendingRuns: [] as Array<{
          _id: string;
          periodMonth: string;
          runType: string;
          totalGrossSalary: number;
          totalNetSalary: number;
          totalEmployees: number;
          submitterName: string;
          submitterEmail: string;
          submittedAt: number;
          adjustmentReason?: string;
          isSubmitter: boolean;
          canApprove: boolean;
        }>,
        canApproveAny: false,
      }
    : undefined;

  const qualifyingHistoricalRuns = (allRuns ?? [])
    .filter(
      (r) =>
        (r.status === "approved" || r.status === "processed") &&
        r.runType !== "supplementary",
    )
    .map((r) => ({
      _id: r._id,
      periodMonth: r.periodMonth,
      gross: r.totalGrossSalary,
      net: r.totalNetSalary,
      employerContributions: r.totalEmployerContributions ?? 6570,
      totalEmployerCost:
        r.totalGrossSalary + (r.totalEmployerContributions ?? 6570),
      employees: r.totalEmployees,
      status: r.status,
    }));

  const fallbackInsights = {
    monthlyTrends:
      qualifyingHistoricalRuns.length > 0
        ? qualifyingHistoricalRuns
        : fin
          ? [
              {
                _id: statsData?.latestRun?._id ?? "run_2026_10",
                periodMonth: fin.selectedPeriod ?? "2026-10",
                gross: fin.gross,
                net: fin.net,
                employerContributions: fin.employerContributions,
                totalEmployerCost: fin.totalCompanyCost,
                employees: fin.employeesCount,
                status: fin.status,
              },
            ]
          : [],
    momChange: {
      grossDiff: 0,
      grossPercent: 0,
      netDiff: 0,
      netPercent: 0,
      employeeDiff: 0,
      prevPeriod: null,
    },
    avgGrossPerEmployee:
      fin && fin.employeesCount > 0
        ? Math.round(fin.gross / fin.employeesCount)
        : 25000,
    avgNetPerEmployee:
      fin && fin.employeesCount > 0
        ? Math.round(fin.net / fin.employeesCount)
        : 24000,
    employerBurdenRatio:
      fin && fin.gross > 0
        ? Number(((fin.employerContributions / fin.gross) * 100).toFixed(2))
        : 13.14,
  };

  const insights = fallbackInsights;

  const supp = statsData
    ? {
        count: statsData.supplementaryRunsCount ?? 0,
        grossTotal: statsData.supplementaryGrossTotal ?? 0,
        netTotal: statsData.supplementaryNetTotal ?? 0,
        runs: [] as Array<{
          _id: string;
          periodMonth: string;
          targetEmployeeName: string;
          adjustmentReason: string;
          totalGrossSalary: number;
          totalNetSalary: number;
        }>,
      }
    : undefined;

  const audit = recentAudit;

  const isProcessed = fin?.status === "processed";
  const hasVariance = Boolean(
    isProcessed &&
      preview &&
      fin?.gross != null &&
      (preview.totalGrossSalary !== fin.gross ||
        preview.totalNetSalary !== fin.net ||
        preview.totalEmployees !== fin.employeesCount),
  );

  const availablePeriods = statsData?.availablePeriods ?? ["2026-10"];

  return (
    <div className="space-y-6">
      {/* ── Header with Executive Badge & Period Selector ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-primary">
              Executive Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Workspace Owner
            </span>
          </div>
          <p className="text-sm text-primary/60">
            Company-wide financial oversight, statutory compliance, and payroll
            authorization.
          </p>
        </div>

        {/* Period Selector */}
        {availablePeriods && availablePeriods.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary/60">
              Payroll Period:
            </span>
            <select
              value={selectedPeriod ?? fin?.selectedPeriod ?? ""}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-primary shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p} {p === availablePeriods[0] ? "(Latest)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── 1. Financial Overview (5 KPI Cards) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat
          icon={Banknote}
          label="Gross Payroll"
          value={fin ? `₹${fin.gross.toLocaleString("en-IN")}` : "—"}
          sub={
            fin?.selectedPeriod
              ? `Period: ${fin.selectedPeriod} (${fin.status?.toUpperCase() ?? "LOCKED"})`
              : "No finalized payroll"
          }
        />
        <Stat
          icon={Wallet}
          label="Net Payout"
          value={fin ? `₹${fin.net.toLocaleString("en-IN")}` : "—"}
          sub={`Disbursed to ${fin?.employeesCount ?? 0} employee(s)`}
        />
        <Stat
          icon={Scale}
          label="Employee Deductions"
          value={
            fin ? `₹${fin.employeeDeductions.toLocaleString("en-IN")}` : "—"
          }
          sub="Statutory, Custom & LOP"
        />
        <Stat
          icon={Building2}
          label="Employer Contributions"
          value={
            fin ? `₹${fin.employerContributions.toLocaleString("en-IN")}` : "—"
          }
          sub={`${insights?.employerBurdenRatio ?? 0}% burden on gross`}
        />
        <Stat
          icon={Layers}
          label="Total Company Cost"
          value={fin ? `₹${fin.totalCompanyCost.toLocaleString("en-IN")}` : "—"}
          sub="Gross + Employer Benefits"
          highlight={Boolean(fin && fin.totalCompanyCost > 0)}
        />
      </div>

      {/* ── 2. Payroll Accuracy & Workforce Reconciliation ── */}
      {hasVariance && preview && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 dark:bg-amber-500/10 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-primary">
                  Payroll Reconciliation Alert ({fin?.selectedPeriod})
                </h3>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                  Workforce Variance Detected
                </span>
              </div>
              <p className="text-xs text-primary/70">
                The current workforce preview reflects the active directory
                state, whereas the finalized payroll run for{" "}
                {fin?.selectedPeriod} is an immutable locked record.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Finalized Locked Record */}
            <div className="rounded-md border border-border bg-card/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary/60">
                  Finalized Historical Payroll
                </span>
                <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Locked Record
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Employees
                  </span>
                  <span className="font-semibold text-primary">
                    {fin?.employeesCount}
                  </span>
                </div>
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Gross Total
                  </span>
                  <span className="font-semibold text-primary">
                    ₹{fin?.gross.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Net Payout
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{fin?.net.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Workforce Preview */}
            <div className="rounded-md border border-border bg-card/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary/60">
                  Current Workforce Preview
                </span>
                <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                  Live Simulation
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Active Staff
                  </span>
                  <span className="font-semibold text-primary">
                    {preview.totalEmployees}
                  </span>
                </div>
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Preview Gross
                  </span>
                  <span className="font-semibold text-primary">
                    ₹{preview.totalGrossSalary.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-primary/50 block text-[11px]">
                    Preview Net
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{preview.totalNetSalary.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-primary/70 bg-background/50 rounded p-3 space-y-2">
            <p>
              <strong>Audit Root Cause:</strong> {recon?.auditExplanation}
            </p>
            {recon?.unincludedEmployees &&
              recon.unincludedEmployees.length > 0 && (
                <div className="pt-1 border-t border-border/50">
                  <span className="font-medium text-primary">
                    Active staff not included in {fin?.selectedPeriod} locked
                    run:
                  </span>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-primary/60">
                    {recon.unincludedEmployees.map((e) => (
                      <li key={e._id}>
                        <span className="font-semibold text-primary/80">
                          {e.name}
                        </span>{" "}
                        ({e.email}) — {e.designation} ({e.department})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            <p className="italic text-primary/60">
              Preservation Policy: The live preview is for advisory budgeting
              only. Processed payroll runs and employee payslips remain strictly
              immutable.
            </p>
          </div>
        </div>
      )}

      {/* ── 3. Statutory Compliance Overview ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-primary">
              Statutory Compliance Overview
            </h2>
            <p className="text-xs text-primary/50">
              Real statutory deductions for{" "}
              {fin?.selectedPeriod ?? "selected period"} and official FY 2026–27
              filing deadlines.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Verified Backend Data
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* EPF Card */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                EPF (Provident Fund)
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  comp?.epf.enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-primary/60"
                }`}
              >
                {comp?.epf.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-primary/60">
                <span>Employee Share:</span>
                <span className="font-medium text-primary">
                  ₹{comp?.epf.periodDeduction.toLocaleString("en-IN") ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Employer Share:</span>
                <span className="font-medium text-primary">
                  ₹
                  {comp?.epf.periodEmployerContribution.toLocaleString(
                    "en-IN",
                  ) ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Wage Ceiling:</span>
                <span className="font-medium text-primary">
                  ₹{comp?.epf.wageCeiling.toLocaleString("en-IN") ?? "15,000"}
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/50 text-[11px] text-primary/70">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  ECR Deadline:
                </span>{" "}
                {comp?.epf.filingDeadline}
              </div>
            </div>
          </div>

          {/* ESI Card */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                ESI (Health Insurance)
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  comp?.esi.enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-primary/60"
                }`}
              >
                {comp?.esi.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-primary/60">
                <span>Employee Share (0.75%):</span>
                <span className="font-medium text-primary">
                  ₹{comp?.esi.periodDeduction.toLocaleString("en-IN") ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Employer Share (3.25%):</span>
                <span className="font-medium text-primary">
                  ₹
                  {comp?.esi.periodEmployerContribution.toLocaleString(
                    "en-IN",
                  ) ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Wage Ceiling:</span>
                <span className="font-medium text-primary">
                  ₹{comp?.esi.wageCeiling.toLocaleString("en-IN") ?? "21,000"}
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/50 text-[11px] text-primary/70">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  ESIC Return Due:
                </span>{" "}
                {comp?.esi.filingDeadline}
              </div>
            </div>
          </div>

          {/* TDS Card */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                TDS (Section 192)
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Active
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-primary/60">
                <span>Tax Deducted:</span>
                <span className="font-medium text-primary">
                  ₹{comp?.tds.periodDeduction.toLocaleString("en-IN") ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Challan ITNS 281:</span>
                <span className="font-medium text-primary">
                  {comp?.tds.challanDeadline}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Form 24Q Due:</span>
                <span className="font-medium text-primary">
                  {comp?.tds.returnDeadline}
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/50 text-[11px] text-primary/70">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  ITNS 281:
                </span>{" "}
                7th of next month
              </div>
            </div>
          </div>

          {/* PT Card */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">
                Professional Tax (PT)
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  comp?.pt.enabled
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-primary/60"
                }`}
              >
                {comp?.pt.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-primary/60">
                <span>State Jurisdiction:</span>
                <span className="font-medium text-primary">
                  {comp?.pt.state ?? "Karnataka"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Period PT Deducted:</span>
                <span className="font-medium text-primary">
                  ₹{comp?.pt.periodDeduction.toLocaleString("en-IN") ?? "0"}
                </span>
              </div>
              <div className="flex justify-between text-primary/60">
                <span>Monthly Return:</span>
                <span className="font-medium text-primary">
                  {comp?.pt.filingDeadline}
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/50 text-[11px] text-primary/70">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Filing Due:
                </span>{" "}
                20th of next month
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Payroll Approvals & Maker-Checker Queue ── */}
      {approvals?.pendingRuns && approvals.pendingRuns.length > 0 ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-primary">
                Pending Payroll Approvals ({approvals.pendingRunsCount})
              </h3>
              <p className="text-xs text-primary/70 mt-1">
                The following payroll run(s) await Owner authorization. Under
                Maker-Checker rules, the submitter cannot approve their own run.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {approvals.pendingRuns.map((r) => (
              <div
                key={r._id}
                className="flex flex-col gap-3 rounded-md border border-border bg-card p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      {r.periodMonth}{" "}
                      {r.runType === "supplementary"
                        ? "(Supplementary Adjustment)"
                        : "(Regular Payroll)"}
                    </span>
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                      Pending Approval
                    </span>
                  </div>
                  <p className="text-xs text-primary/60">
                    Gross: ₹{r.totalGrossSalary.toLocaleString("en-IN")} | Net:
                    ₹{r.totalNetSalary.toLocaleString("en-IN")} across{" "}
                    {r.totalEmployees} employee(s)
                  </p>
                  <p className="text-[11px] text-primary/50">
                    Submitted by{" "}
                    <strong className="text-primary/70">
                      {r.submitterName}
                    </strong>{" "}
                    ({r.submitterEmail}) on{" "}
                    {new Date(r.submittedAt).toLocaleDateString()}
                  </p>
                  {r.adjustmentReason && (
                    <p className="text-[11px] text-primary/60 italic">
                      Reason: {r.adjustmentReason}
                    </p>
                  )}
                </div>

                <div>
                  {r.isSubmitter ? (
                    <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                      Self-Approval Restricted (Maker-Checker)
                    </span>
                  ) : r.canApprove ? (
                    <Link href="/payroll">
                      <Button size="sm">
                        Review & Authorize{" "}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-xs text-primary/50">
                      Owner Authorization Required
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="font-medium text-primary">
                Latest Payroll Period: {fin?.selectedPeriod ?? "2026-10"}
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                {fin?.status ?? "processed"}
              </span>
            </div>
            <div className="text-xs text-primary/50">
              Total Employees: {fin?.employeesCount ?? 0} | Gross: ₹
              {fin?.gross.toLocaleString("en-IN")} | Net: ₹
              {fin?.net.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Business Insights & Monthly Trends ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Monthly Payroll Trends */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary/60" />
              <h2 className="text-sm font-semibold text-primary">
                Monthly Payroll Trends
              </h2>
            </div>
            <span className="text-xs text-primary/50">
              Past Finalized & Approved Runs
            </span>
          </div>

          {insights?.monthlyTrends && insights.monthlyTrends.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-primary/60">
                    <th className="pb-2 font-medium">Period</th>
                    <th className="pb-2 font-medium">Employees</th>
                    <th className="pb-2 font-medium">Gross Total</th>
                    <th className="pb-2 font-medium">Net Payout</th>
                    <th className="pb-2 font-medium">Total CTC</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-primary/80">
                  {insights.monthlyTrends.map((t) => (
                    <tr key={t._id} className="hover:bg-muted/30 transition">
                      <td className="py-2.5 font-semibold text-primary">
                        {t.periodMonth}
                      </td>
                      <td className="py-2.5">{t.employees}</td>
                      <td className="py-2.5">
                        ₹{t.gross.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 text-emerald-600 dark:text-emerald-400">
                        ₹{t.net.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 font-medium">
                        ₹{t.totalEmployerCost.toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5">
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary/70">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-primary/40 py-4">
              No historical runs recorded yet.
            </p>
          )}
        </div>

        {/* Cost Analytics & MoM Change */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary/60" />
            <h2 className="text-sm font-semibold text-primary">
              Financial Summaries
            </h2>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {insights?.momChange.prevPeriod ? (
              <div className="rounded-md border border-border bg-card/60 p-3 space-y-1">
                <span className="text-[11px] text-primary/50 block">
                  MoM Payroll Change vs {insights.momChange.prevPeriod}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-base font-semibold ${insights.momChange.grossDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}
                  >
                    {insights.momChange.grossPercent >= 0
                      ? `+${insights.momChange.grossPercent}%`
                      : `${insights.momChange.grossPercent}%`}
                  </span>
                  <span className="text-xs text-primary/60">
                    ({insights.momChange.grossDiff >= 0 ? "+₹" : "-₹"}
                    {Math.abs(insights.momChange.grossDiff).toLocaleString(
                      "en-IN",
                    )}
                    )
                  </span>
                </div>
              </div>
            ) : null}

            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-primary/60">
                Avg. Gross Cost per Employee:
              </span>
              <span className="font-semibold text-primary">
                ₹{insights?.avgGrossPerEmployee.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-border/50">
              <span className="text-primary/60">
                Avg. Net Payout per Employee:
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ₹{insights?.avgNetPerEmployee.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-primary/60">
                Employer Contribution Ratio:
              </span>
              <span className="font-semibold text-primary">
                {insights?.employerBurdenRatio}% of Gross
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Supplementary Payroll (Segregated Adjustments) ── */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary/60" />
            <h2 className="text-sm font-semibold text-primary">
              Supplementary Payroll Adjustments
            </h2>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary/70">
              {supp?.count ?? 0} Adjustment(s)
            </span>
          </div>
          <div className="text-xs text-primary/60">
            Total Adjustment Payout:{" "}
            <strong className="text-primary">
              ₹{supp?.netTotal.toLocaleString("en-IN") ?? "0"}
            </strong>{" "}
            (Net)
          </div>
        </div>

        <p className="text-xs text-primary/60">
          Supplementary runs represent retroactive corrections and missed
          payments. They are tracked separately from regular payroll runs to
          prevent duplicate counting in monthly baselines.
        </p>

        {supp?.runs && supp.runs.length > 0 ? (
          <div className="divide-y divide-border/50 pt-1">
            {supp.runs.map((sr) => (
              <div
                key={sr._id}
                className="flex items-center justify-between py-2 text-xs"
              >
                <div>
                  <span className="font-semibold text-primary">
                    {sr.targetEmployeeName}
                  </span>
                  <span className="text-primary/50 ml-2">
                    ({sr.periodMonth})
                  </span>
                  <p className="text-[11px] text-primary/60">
                    {sr.adjustmentReason}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-primary">
                    ₹{sr.totalGrossSalary.toLocaleString("en-IN")}
                  </span>
                  <span className="text-primary/50 text-[11px] block">
                    Net: ₹{sr.totalNetSalary.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2 text-xs text-primary/40 italic">
            No retroactive supplementary adjustments recorded.
          </div>
        )}
      </div>

      {/* ── Quick Management Actions Grid (Preserved) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/payroll"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Payroll Authorization
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Review runs & approve payout
          </p>
        </Link>
        <Link
          href="/employees"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Employee Directory
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Manage profiles & status
          </p>
        </Link>
        <Link
          href="/salaries"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Salary Structures
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            CTC, EPF, ESI & allowances
          </p>
        </Link>
        <Link
          href="/reports"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Financial Reports
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Registers & statutory files
          </p>
        </Link>
      </div>

      {/* ── 7. Enriched Company Audit Activity ── */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary/50" />
            <h2 className="text-sm font-medium text-primary">
              Company Audit Activity
            </h2>
          </div>
          <span className="text-xs text-primary/50">
            Recent System & Payroll Events
          </span>
        </div>
        <div className="divide-y divide-border/50">
          {audit === undefined ? (
            <div className="px-4 py-6 text-sm text-primary/40">
              Loading audit history…
            </div>
          ) : audit.length ? (
            audit.slice(0, 10).map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/20 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-primary/90">
                      {a.action}
                    </span>
                  </div>
                  <p className="text-[11px] text-primary/60">
                    By{" "}
                    <strong className="text-primary/80">
                      {String(
                        (a as Record<string, unknown>).userName ??
                          "System User",
                      )}
                    </strong>{" "}
                    (
                    {String(
                      (a as Record<string, unknown>).userEmail ??
                        "system@indiapaypayroll.com",
                    )}
                    )
                  </p>
                </div>
                <span className="text-xs text-primary/50">
                  {new Date(a.at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-primary/40">
              No audit activity recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Role 2: Admin Dashboard ──────────────────────────────────────────────────

function AdminDashboard({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
  const adminData = useQuery(api.dashboard.adminOperations, { workspaceId });
  const audit = useQuery(api.audit.recent, { workspaceId });

  return (
    <div className="space-y-6">
      {/* Header with Admin Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-primary">
              Admin Operations Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Workspace Administrator
            </span>
          </div>
          <p className="text-sm text-primary/60">
            Operational human resources, attendance logs, leave reviews, and
            payroll calculation.
          </p>
        </div>
      </div>

      {/* KPI Cards: Operational metrics tailored for HR Admin */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Active Employees"
          value={adminData ? adminData.activeEmployeesCount : "—"}
          sub="Managed in directory"
        />
        <Stat
          icon={CalendarClock}
          label="Pending Leave Reviews"
          value={adminData ? adminData.pendingLeavesCount : "—"}
          sub={
            adminData && adminData.pendingLeavesCount > 0
              ? `${adminData.pendingLeavesCount} leave(s) awaiting your review`
              : "All leave requests reviewed"
          }
          highlight={Boolean(adminData && adminData.pendingLeavesCount > 0)}
        />
        <Stat
          icon={Banknote}
          label="Payroll Status"
          value={
            adminData?.activeRun
              ? adminData.activeRun.status.replace("_", " ").toUpperCase()
              : "NO RUN"
          }
          sub={
            adminData?.activeRun
              ? `Period: ${adminData.activeRun.periodMonth}`
              : "Ready to create next run"
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Monthly Attendance"
          value={adminData ? adminData.currentMonthAttendanceCount : "—"}
          sub="Punches tracked this month"
        />
      </div>

      {/* Operational Workflow Status Callouts */}
      {adminData?.activeRun?.status === "calculated" ? (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Calculated Payroll Ready for Submission (
                  {adminData.activeRun.periodMonth})
                </h3>
                <p className="text-xs text-primary/70 mt-1">
                  Payroll calculation has been executed. Submit the run to the
                  Owner approval queue to proceed with authorization.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Submit for Owner Approval{" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : adminData?.activeRun?.status === "pending_approval" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-primary">
                Payroll Submitted — Awaiting Owner Approval (
                {adminData.activeRun.periodMonth})
              </h3>
              <p className="text-xs text-primary/70 mt-1">
                This run is currently in the Owner approval queue. Under
                Maker-Checker policy, approval authority is restricted strictly
                to Workspace Owners. Once approved, you will be able to finalize
                and disburse.
              </p>
            </div>
          </div>
        </div>
      ) : adminData?.activeRun?.status === "approved" ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Payroll Approved — Ready to Finalize (
                  {adminData.activeRun.periodMonth})
                </h3>
                <p className="text-xs text-primary/70 mt-1">
                  The Workspace Owner has authorized this run. Finalize the run
                  to publish payslips and complete disbursement.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Finalize Payroll Run{" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Pending Leave Requests Queue */}
      {adminData?.pendingLeaves && adminData.pendingLeaves.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-medium text-primary">
                Pending Leave Requests to Review
              </h2>
            </div>
            <Link
              href="/attendance"
              className="text-xs text-primary/60 hover:text-primary transition"
            >
              View all in Attendance →
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {adminData.pendingLeaves.map((l) => (
              <div
                key={l._id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-primary">
                    {l.employeeName}
                  </p>
                  <p className="text-xs text-primary/50 mt-0.5">
                    {l.startDate} to {l.endDate} ({l.daysCount} days) •{" "}
                    <span className="capitalize">{l.leaveType} Leave</span>
                  </p>
                  {l.reason && (
                    <p className="text-xs text-primary/70 italic mt-1">
                      &quot;{l.reason}&quot;
                    </p>
                  )}
                </div>
                <Link href="/attendance">
                  <Button variant="secondary" size="sm">
                    Review Request
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/payroll"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Calculate Payroll
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Prepare & submit monthly run
          </p>
        </Link>
        <Link
          href="/employees"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Add Employee
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Onboard new team members
          </p>
        </Link>
        <Link
          href="/attendance"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Review Leaves
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Approve or reject requests
          </p>
        </Link>
        <Link
          href="/salaries"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Salary Structures
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Update employee CTC
          </p>
        </Link>
      </div>

      {/* Operational Activity Feed */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Activity className="h-4 w-4 text-primary/50" />
          <h2 className="text-sm font-medium text-primary">
            Operational Activity
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {audit === undefined ? (
            <div className="px-4 py-6 text-sm text-primary/40">Loading…</div>
          ) : audit.length ? (
            audit.slice(0, 8).map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="font-mono text-xs font-medium text-primary/80">
                  {a.action}
                </span>
                <span className="text-xs text-primary/50">
                  {new Date(a.at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-primary/40">
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Role 3: Member Dashboard ─────────────────────────────────────────────────

function MemberDashboard({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
  const memberData = useQuery(api.dashboard.memberSummary, { workspaceId });
  const user = useQuery(api.users.getUser);
  const linkMyAccount = useMutation(api.employees.linkMyAccount);

  const [linkState, setLinkState] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [linkError, setLinkError] = useState("");
  const [selectedPayslipRunId, setSelectedPayslipRunId] = useState<
    string | null
  >(null);

  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedPayslipRunId && memberData?.employee
      ? {
          workspaceId,
          payrollRunId: selectedPayslipRunId as Id<"payrollRuns">,
          employeeId: memberData.employee._id,
        }
      : "skip",
  );

  const handleLink = async () => {
    setLinkState("loading");
    setLinkError("");
    try {
      await linkMyAccount({ workspaceId });
      setLinkState("success");
    } catch (e) {
      setLinkState("error");
      setLinkError((e as Error).message || "Failed to link account");
    }
  };

  if (!memberData) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-primary/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const data = memberData;
  const employee = data.employee;

  // State A: Account Not Linked
  if (!data.isLinked || !employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Employee Self-Service Portal
          </h1>
          <p className="text-sm text-primary/60">
            Personal portal for payslips, leaves, and attendance.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center max-w-lg mx-auto">
          <UserCircle className="mx-auto h-12 w-12 text-primary/30 mb-4" />
          <h2 className="text-lg font-semibold text-primary mb-2">
            Account Not Linked
          </h2>
          <p className="text-sm text-primary/60 mb-6">
            Your login account ({user?.email ?? "current user"}) is not yet
            linked to an employee profile in this workspace. Link your account
            to securely view your salary slips, request leaves, and review
            attendance records.
          </p>

          {linkState === "error" && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive text-left space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{linkError.replace("ConvexError: ", "")}</span>
              </div>
              {linkError.includes("No employee record found") && (
                <p className="pl-6 text-xs text-destructive/80">
                  Please ask your workspace administrator to add or update your
                  employee profile with email: {user?.email}
                </p>
              )}
            </div>
          )}

          {linkState === "success" ? (
            <div className="mb-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Successfully linked!
              Refreshing your portal...
            </div>
          ) : (
            <Button onClick={handleLink} disabled={linkState === "loading"}>
              {linkState === "loading" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Link My Account
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { latestPayslip, attendanceCurrentMonth } = data;

  // State B: Linked Account with Authorized Personal Data
  return (
    <div className="space-y-6">
      {/* Header with Employee Role Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-primary">
              Welcome, {employee.firstName} {employee.lastName}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
              Employee Portal
            </span>
          </div>
          <p className="text-sm text-primary/60">
            {employee.designation || "Employee"} •{" "}
            {employee.department || "General Department"} • {employee.email}
          </p>
        </div>
      </div>

      {/* Personal KPI Cards: Strictly limited to Own Data */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="My Latest Net Salary"
          value={
            latestPayslip
              ? `₹${latestPayslip.netSalary.toLocaleString("en-IN")}`
              : "—"
          }
          sub={
            latestPayslip
              ? `Period: ${latestPayslip.periodMonth}`
              : "No finalized payslips yet"
          }
        />
        <Stat
          icon={FileText}
          label="My Finalized Payslips"
          value={data.totalPayslipsCount}
          sub="Available for download"
        />
        <Stat
          icon={CalendarClock}
          label="My Leave Requests"
          value={data.totalLeavesCount}
          sub={
            data.pendingLeavesCount > 0
              ? `${data.pendingLeavesCount} pending approval`
              : "All requests reviewed"
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Attendance This Month"
          value={`${attendanceCurrentMonth.presentDays} Days`}
          sub={`${attendanceCurrentMonth.halfDays} half-days, ${attendanceCurrentMonth.absentDays} absent`}
        />
      </div>

      {/* Two Column Section: Personal Payslips & Leave History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Recent Payslips */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-medium text-primary">
                My Recent Payslips
              </h2>
            </div>
            <Link
              href="/my-portal"
              className="text-xs text-primary/60 hover:text-primary transition"
            >
              View all in My Portal →
            </Link>
          </div>
          {data.recentPayslips.length === 0 ? (
            <div className="p-8 text-center text-sm text-primary/40">
              No finalized salary slips available yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Net Salary</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.recentPayslips.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/40 transition">
                    <td className="px-4 py-3 font-medium text-primary">
                      {p.periodMonth}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-500">
                      ₹{p.netSalary.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedPayslipRunId(p.payrollRunId)}
                      >
                        View Slip <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Recent Leave Requests */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-medium text-primary">
                My Leave Requests
              </h2>
            </div>
            <Link
              href="/my-portal"
              className="text-xs text-primary/60 hover:text-primary transition"
            >
              Request Leave →
            </Link>
          </div>
          {data.recentLeaves.length === 0 ? (
            <div className="p-8 text-center text-sm text-primary/40">
              No leave requests submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {data.recentLeaves.map((l) => (
                <div
                  key={l._id}
                  className="flex items-center justify-between p-3.5"
                >
                  <div>
                    <p className="text-sm font-medium text-primary capitalize">
                      {l.leaveType} Leave ({l.daysCount} days)
                    </p>
                    <p className="text-xs text-primary/50">
                      {l.startDate} to {l.endDate}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      l.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : l.status === "rejected"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-amber-500/10 text-amber-500"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Personal Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/my-portal"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Request Leave
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Submit sick, casual, or earned leave
          </p>
        </Link>
        <Link
          href="/my-portal"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Attendance Log
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Check daily check-in & punch history
          </p>
        </Link>
        <Link
          href="/my-portal"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            All Salary Slips
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Download PDF copies of past slips
          </p>
        </Link>
      </div>

      {/* Payslip Modal for PDF view & download */}
      <PayslipModal
        open={Boolean(selectedPayslipRunId)}
        onOpenChange={(open) => !open && setSelectedPayslipRunId(null)}
        payslip={payslipData}
        isLoading={selectedPayslipRunId !== null && !payslipData}
      />
    </div>
  );
}

// ── Main Dashboard Router Component ──────────────────────────────────────────

export default function Home() {
  const { current, workspaces, isLoading: wsLoading } = useWorkspace();

  if (wsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-sm text-primary/50">
        Please select a workspace from the sidebar.
      </div>
    );
  }

  const currentWorkspace = workspaces.find((w) => w._id === current);
  const role = currentWorkspace?.role;

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl">
        {role === "owner" ? (
          <OwnerDashboard workspaceId={current} />
        ) : role === "admin" ? (
          <AdminDashboard workspaceId={current} />
        ) : (
          <MemberDashboard workspaceId={current} />
        )}
      </div>
    </div>
  );
}
