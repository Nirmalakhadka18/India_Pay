"use client";

import { useState } from "react";
import {
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldCheck,
  TrendingUp,
  Download,
  Sparkles,
  Lock,
  ChevronRight,
  Eye,
} from "lucide-react";

export function HeroDashboardPreview() {
  const [activeTab, setActiveTab] = useState<"payroll" | "statutory" | "ai">("payroll");

  return (
    <div className="relative mx-auto max-w-5xl w-full rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-white dark:bg-[#0A0F1D]/90 p-2 sm:p-4 shadow-xl dark:shadow-[0_0_80px_rgba(37,99,235,0.18)] backdrop-blur-2xl overflow-hidden transition-colors duration-200">
      {/* Top Ambient Highlight */}
      <div className="absolute -top-[1px] left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-blue-500 dark:via-cyan-400 to-transparent opacity-80" />

      {/* Window Title Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/[0.08] px-3 py-2.5 gap-2 bg-slate-50 dark:bg-transparent rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[170px] sm:max-w-none">
            indiapay.internal / payroll / 2026-10
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">Live </span>Workspace
          </span>
          <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 hidden sm:inline">
            Period: Oct 2026
          </span>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="p-2.5 sm:p-6 space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden">
        {/* Top Status & Approval Banner */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/70 dark:bg-gradient-to-r dark:from-emerald-500/10 dark:via-emerald-950/20 dark:to-transparent p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Payroll Run for Oct 2026 is APPROVED
                </h4>
                <span className="text-[9px] sm:text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Total Net Payout: ₹48,000 across 4 employees. Statutory calculations locked.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-colors shadow-sm dark:shadow-none">
              Audit Logs
            </button>
            <button className="px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-emerald-600/30">
              Finalize & Lock
            </button>
          </div>
        </div>

        {/* 4 Core KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Active Employees</span>
              <Users className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">4 Staff</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <span>100% Eligible</span>
              <span className="text-slate-400 dark:text-slate-500">&bull;</span>
              <span className="text-slate-500 dark:text-slate-400">0 On Hold</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Total Gross Salary</span>
              <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">₹50,000</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Base + Allowances
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>LOP Deductions</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">₹2,000</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              1 Unpaid Leave Day
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Net Disbursement</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">₹48,000</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              After Statutory & LOP
            </p>
          </div>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-3 gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.03] p-1 rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab("payroll")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === "payroll"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Employee Payroll Register
            </button>
            <button
              onClick={() => setActiveTab("statutory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                activeTab === "statutory"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Statutory Breakdown (PF / ESI / PT)
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === "ai"
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-300" />
              <span>AI Variance Audit</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden md:inline shrink-0">
            Interactive Product Simulation
          </span>
        </div>

        {/* Tab 1: Employee Payroll Register */}
        {activeTab === "payroll" && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.08] w-full max-w-full bg-white dark:bg-transparent">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 uppercase font-mono tracking-wider border-b border-slate-200 dark:border-white/[0.06]">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Basic (₹)</th>
                  <th className="py-3 px-3">Gross (₹)</th>
                  <th className="py-3 px-3">LOP Days</th>
                  <th className="py-3 px-3">LOP Ded. (₹)</th>
                  <th className="py-3 px-3 text-right">Net Salary (₹)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300 font-sans">
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    <div>Dev User</div>
                    <div className="text-[10px] text-slate-500">Engineering &bull; Member</div>
                  </td>
                  <td className="py-3 px-3">₹30,000</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">₹50,000</td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-medium">1.0 Day</td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-medium">-₹2,000</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹48,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-[10px] font-medium border border-blue-500/20 dark:border-cyan-500/20">
                      <FileText className="w-3 h-3" /> Payslip PDF
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    <div>Dev Admin</div>
                    <div className="text-[10px] text-slate-500">Operations &bull; Admin</div>
                  </td>
                  <td className="py-3 px-3">₹30,000</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">₹50,000</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">0 Days</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">₹0</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹50,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-[10px] font-medium border border-blue-500/20 dark:border-cyan-500/20">
                      <FileText className="w-3 h-3" /> Payslip PDF
                    </span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                    <div>Nirmala Khadka</div>
                    <div className="text-[10px] text-slate-500">Executive &bull; Active</div>
                  </td>
                  <td className="py-3 px-3">₹30,000</td>
                  <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">₹50,000</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">0 Days</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">₹0</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹50,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400 text-[10px] font-medium border border-blue-500/20 dark:border-cyan-500/20">
                      <FileText className="w-3 h-3" /> Payslip PDF
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Statutory Breakdown */}
        {activeTab === "statutory" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">EPF (Provident Fund)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-cyan-400">
                    Act 1952
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>Statutory Ceiling:</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹15,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Share (12%):</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹1,800/ee</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employer Share (EPF/EPS):</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹1,800/ee</span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-cyan-300 font-semibold pt-1">
                    <span>Export Format:</span>
                    <span>11-field #~# ECR</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">ESIC (Employee State Ins.)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    Act 1948
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>Wage Threshold:</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹21,000/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employee Rate:</span>
                    <span className="font-mono text-slate-900 dark:text-white">0.75%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Employer Rate:</span>
                    <span className="font-mono text-slate-900 dark:text-white">3.25%</span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-cyan-300 font-semibold pt-1">
                    <span>Export Format:</span>
                    <span>Official 6-Col Excel</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">Professional Tax (PT)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Form 5A
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-white/[0.06]">
                  <div className="flex justify-between">
                    <span>Karnataka Slab (&ge;₹25k):</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹200/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>February Surge:</span>
                    <span className="font-mono text-slate-900 dark:text-white">₹300/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multi-State Sched:</span>
                    <span className="font-mono text-slate-900 dark:text-white">MH, TS, AP</span>
                  </div>
                  <div className="flex justify-between text-blue-600 dark:text-cyan-300 font-semibold pt-1">
                    <span>Export Format:</span>
                    <span>Statutory PDF Return</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Variance Audit */}
        {activeTab === "ai" && (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-600 dark:text-cyan-400 border border-blue-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Gemini AI Payroll Engine Audit Finding:
              </span>
            </div>

            <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#080D19]/60 p-3 rounded-lg border border-slate-200 dark:border-white/[0.06] font-mono shadow-sm dark:shadow-none">
              &ldquo;Reconciliation check passed for period 2026-10. Active staff count matches eligible structure (4 employees). 1 unpaid LOP deduction was detected for Dev User (-₹2,000), reducing the net payout from ₹50,000 to ₹48,000 with zero statutory anomalies.&rdquo;
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 0 Missing Salary Structures
              </span>
              <span>&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Math Idempotency Verified
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
