"use client";

import { PayslipModal } from "@/components/payslip-modal";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import {
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  Percent,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function SalaryPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const payslips = useQuery(api.payroll.getMyPayslips, scoped);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [revealSensitive, setRevealSensitive] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "payslips" | "structure" | "bank_tax"
  >("payslips");

  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedRunId && me
      ? {
          workspaceId,
          payrollRunId: selectedRunId as Id<"payrollRuns">,
          employeeId: me._id,
        }
      : "skip",
  );

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  if (me === undefined) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-primary/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-8 text-center text-sm text-primary/60">
        No employee record linked to your user account.
      </div>
    );
  }

  const latestSlip = payslips && payslips.length > 0 ? payslips[0] : null;

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-emerald-500" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                My Salary & Payslips
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Access your published monthly payslips, statutory deductions (PF, ESI, PT, TDS), and payout bank details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Confidential Employee Record
            </span>
          </div>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/50">
              Latest Net Payout
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {latestSlip
                ? `₹${latestSlip.netSalary.toLocaleString("en-IN")}`
                : "—"}
            </p>
            <p className="text-xs text-primary/50">
              {latestSlip ? `Period: ${latestSlip.periodMonth}` : "No payslips published yet"}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/50">
              Published Payslips
            </p>
            <p className="text-2xl font-bold text-primary font-mono">
              {payslips?.length ?? 0}
            </p>
            <p className="text-xs text-primary/50">Available for PDF download</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-primary/50">
              Disbursement Method
            </p>
            <p className="text-lg font-bold text-primary">Direct Bank Transfer</p>
            <p className="text-xs text-primary/50">
              {me.bankName ? `${me.bankName}` : "Bank account configured"}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("payslips")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "payslips"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            My Payslips
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("structure")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "structure"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Salary Structure
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bank_tax")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "bank_tax"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Bank & Statutory Tax IDs
          </button>
        </div>

        {/* ── TAB 1: PAYSLIPS LIST ─────────────────────────────────────────── */}
        {activeTab === "payslips" && (
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-primary">
                  Monthly Payslips
                </h2>
                <p className="text-xs text-primary/60">
                  Select a payroll period to view the salary break-up or download a PDF payslip.
                </p>
              </div>
            </div>

            {payslips === undefined ? (
              <div className="flex h-48 items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : payslips.length === 0 ? (
              <div className="p-12 text-center text-sm text-primary/50">
                No finalized payslips available yet. Once your workspace administrator processes the payroll run, your payslips will appear here.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Payroll Period</th>
                    <th className="px-6 py-3 font-medium">Published Date</th>
                    <th className="px-6 py-3 font-medium text-emerald-600">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 font-medium">Disbursement</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {payslips.map((p) => (
                    <tr key={p._id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-3 font-semibold text-primary">
                        {p.periodMonth}
                      </td>
                      <td className="px-6 py-3 text-xs text-primary/60">
                        {p.finalizedAt
                          ? new Date(p.finalizedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "Published"}
                      </td>
                      <td className="px-6 py-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3 text-xs">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Processed
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRunId(p.payrollRunId)}
                          className="text-xs"
                        >
                          View & Download PDF <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── TAB 2: SALARY STRUCTURE BREAKDOWN ────────────────────────────── */}
        {activeTab === "structure" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Breakdown */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h3 className="font-semibold text-primary">
                    Monthly Earnings Structure
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-primary/70">Basic Salary</span>
                    <span className="font-mono font-semibold text-primary">
                      {"basicSalary" in me && typeof (me as Record<string, unknown>).basicSalary === "number"
                        ? Number((me as Record<string, unknown>).basicSalary).toLocaleString("en-IN")
                        : "Configured in payroll"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-primary/70">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-semibold text-primary">
                      40% - 50% of Basic
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-primary/70">Special Allowance</span>
                    <span className="font-mono font-semibold text-primary">
                      Flexible component
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <span className="text-primary/70">Conveyance Allowance</span>
                    <span className="font-mono font-semibold text-primary">
                      Statutory standard
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Receipt className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-primary">
                    Statutory Deductions Compliance
                  </h3>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <div>
                      <p className="font-semibold text-primary">Employees&apos; Provident Fund (EPF)</p>
                      <p className="text-[10px] text-primary/50">12% on Basic (statutory ceiling ₹15,000)</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">Applicable</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <div>
                      <p className="font-semibold text-primary">Employee State Insurance (ESIC)</p>
                      <p className="text-[10px] text-primary/50">0.75% (for gross &le; ₹21,000/mo)</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">Applicable</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <div>
                      <p className="font-semibold text-primary">Professional Tax (PT)</p>
                      <p className="text-[10px] text-primary/50">State statutory slabs (e.g. Karnataka ₹200)</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">Applicable</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/40">
                    <div>
                      <p className="font-semibold text-primary">Income Tax TDS (Section 192)</p>
                      <p className="text-[10px] text-primary/50">New / Old Tax Regime</p>
                    </div>
                    <span className="font-mono font-semibold text-primary">Computed monthly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: BANK & STATUTORY DETAILS ─────────────────────────────── */}
        {activeTab === "bank_tax" && (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-base font-semibold text-primary">
                  Payout Banking & Statutory Master Data
                </h3>
                <p className="text-xs text-primary/60">
                  Credentials used for salary disbursements and income tax / PF filings.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealSensitive((v) => !v)}
                className="gap-1.5 text-xs"
              >
                {revealSensitive ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Mask Sensitive
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Reveal Sensitive
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Direct Payout Banking */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/60 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-cyan-600" /> Direct Payout Banking
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-primary/50">Account Holder Name</p>
                    <p className="font-semibold text-primary text-sm mt-0.5">
                      {me.bankAccountHolderName || `${me.firstName} ${me.lastName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">Bank Name & Branch</p>
                    <p className="font-medium text-primary mt-0.5">
                      {me.bankName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">Account Number</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.bankAccountNumber
                        ? revealSensitive
                          ? me.bankAccountNumber
                          : me.maskedBankAccountNumber || me.bankAccountNumber
                        : "Not configured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">IFSC Code</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.ifscCode || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statutory Tax IDs */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-primary/60 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Statutory Identification
                </h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-primary/50">Permanent Account Number (PAN)</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.pan
                        ? revealSensitive
                          ? me.pan
                          : me.maskedPan || me.pan
                        : "Not configured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">Universal Account Number (UAN)</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.uan
                        ? revealSensitive
                          ? me.uan
                          : me.maskedUan || me.uan
                        : "Not configured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">ESIC IP Number</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.esicIpNumber || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-primary/50">PF Member ID</p>
                    <p className="font-mono font-medium text-primary mt-0.5">
                      {me.pfMemberId || "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payslip PDF Modal */}
        <PayslipModal
          open={Boolean(selectedRunId)}
          onOpenChange={(open) => !open && setSelectedRunId(null)}
          payslip={payslipData}
          isLoading={selectedRunId !== null && !payslipData}
        />
      </div>
    </div>
  );
}
