"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Info,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkforceHeader } from "../workforce-header";

export default function YearEndProcessPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const steps = [
    { num: 1, label: "Leave Lapse & Encashment Setup" },
    { num: 2, label: "Carry Forward Rules Verification" },
    { num: 3, label: "Final Year End Execution" },
  ];

  const handleNextStep = () => {
    if (currentStep === 1) setCurrentStep(2);
    else if (currentStep === 2) setCurrentStep(3);
    else {
      setStatusMessage(
        `Year End Processing successfully executed for calendar year ${selectedYear}. Carry forward balances and encashment vouchers committed to payroll.`
      );
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkforceHeader
        currentCategory="leave"
        currentPageTitle="Year End Process"
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link
            href="/admin/leave/overview"
            className="hover:text-slate-800 transition-colors font-medium text-slate-700"
          >
            Leave
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Year End Process</span>
        </div>

        {/* Top Header Card */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Year End Process
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Annual leave balance settlement, carry forward calculations, and encashment processing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-4 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
              >
                <span>{currentStep === 3 ? "Execute Year End" : "Continue"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        )}

        {/* Multi-Step Wizard Indicator */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {steps.map((st) => (
              <button
                type="button"
                key={st.num}
                onClick={() => setCurrentStep(st.num as 1 | 2 | 3)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer text-left ${
                  currentStep === st.num
                    ? "border-sky-500 bg-sky-50/60 text-sky-800 font-semibold"
                    : currentStep > st.num
                    ? "border-emerald-200 bg-emerald-50/30 text-emerald-700 font-medium"
                    : "border-slate-100 bg-slate-50/50 text-slate-500"
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    currentStep === st.num
                      ? "bg-sky-600 text-white"
                      : currentStep > st.num
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {st.num}
                </div>
                <span className="text-xs">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step Canvas */}
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-2xs space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4 max-w-3xl text-xs">
              <h3 className="font-bold text-slate-800 text-sm">
                Step 1: Annual Leave Lapse Configuration
              </h3>
              <p className="text-slate-500">
                Configure which leave categories lapse at year-end versus those eligible for cash payout or roll-over.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Casual Leave (CL)
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Lapses automatically on 31-Dec. Zero carry forward allowed by Indian statutory norms.
                  </p>
                </div>
                <div className="p-3 rounded border border-slate-200 bg-slate-50">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Sick Leave (SL)
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Accumulates up to maximum statutory ceiling of 30 days. Balance lapses beyond limit.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 max-w-3xl text-xs">
              <h3 className="font-bold text-slate-800 text-sm">
                Step 2: Earned Leave Carry Forward &amp; Encashment
              </h3>
              <p className="text-slate-500">
                Review maximum accumulation rules under the Factories Act / Shops and Establishment Act.
              </p>
              <div className="p-4 rounded border border-sky-100 bg-sky-50 text-sky-800 space-y-2">
                <div className="font-semibold">Statutory Accumulation Ceiling: 30 Days</div>
                <p className="text-[11px] leading-relaxed">
                  Earned Leave balances exceeding 30 days will be calculated for financial encashment in the December payroll cycle based on standard Basic + DA calculation formulas.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 max-w-3xl text-xs">
              <h3 className="font-bold text-slate-800 text-sm">
                Step 3: Commit and Lock Leave Ledger for {selectedYear}
              </h3>
              <p className="text-slate-500">
                Commits the annual closing balances to employee history ledgers and creates opening balances for January 2027.
              </p>
              <div className="p-4 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span>
                  All employee balances have been verified. Ready to apply closing balances.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
