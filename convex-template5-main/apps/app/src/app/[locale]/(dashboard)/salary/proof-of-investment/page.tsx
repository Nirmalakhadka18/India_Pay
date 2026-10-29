"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

export default function ProofOfInvestmentPage() {
  const { current: workspaceId } = useWorkspace();
  const [financialYear, setFinancialYear] = useState("Apr 2026 - Mar 2027");
  const [isNoticeExpanded, setIsNoticeExpanded] = useState(true);

  return (
    <div className="flex h-full w-full flex-col bg-[#F9FAFB] dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M0 0H16V20L8 15L0 20V0Z" fill="#F59E0B" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-primary">Proof Of Investment</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Top Control: Financial Year Selector */}
        <div className="flex justify-end">
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
          >
            <option value="Apr 2026 - Mar 2027">Apr 2026 - Mar 2027</option>
            <option value="Apr 2025 - Mar 2026">Apr 2025 - Mar 2026</option>
          </select>
        </div>

        {/* POI Status Notice Banner with Expand / Collapse Control */}
        <div className="overflow-hidden rounded-md border border-amber-200 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20">
          <button
            type="button"
            onClick={() => setIsNoticeExpanded(!isNoticeExpanded)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-amber-100/40 dark:hover:bg-amber-900/30"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                POI Status 2026-2027: NOT YET RELEASED
              </span>
            </div>
            {isNoticeExpanded ? (
              <ChevronUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            )}
          </button>

          {isNoticeExpanded && (
            <div className="border-t border-amber-200/60 px-4 py-2.5 text-xs text-amber-800/90 dark:border-amber-900/30 dark:text-amber-300/80">
              The Proof of Investment (POI) submission window for this financial year is not released by the administrator. Submission will open once authorized by HR.
            </div>
          )}
        </div>

        {/* Large Bordered Content Box */}
        <div className="flex min-h-[440px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          <div className="flex flex-col items-center justify-center text-center">
            {/* greytHR POI Unreleased Illustration */}
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-4"
              aria-hidden="true"
            >
              <g transform="translate(75, 20)">
                {/* Document with folded corner and lock badge */}
                <path
                  d="M10 0H60L85 25V85C85 88 83 90 80 90H10C7 90 5 88 5 85V5C5 2 7 0 10 0Z"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
                <path d="M60 0V25H85" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2.5" />
                <line x1="20" y1="35" x2="65" y2="35" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="48" x2="70" y2="48" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="20" y1="61" x2="50" y2="61" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />

                {/* Shield / Lock indicator */}
                <circle cx="70" cy="70" r="16" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                <rect x="64" y="66" width="12" height="10" rx="1.5" fill="#94A3B8" />
                <path d="M67 66V62C67 60.3 68.3 59 70 59C71.7 59 73 60.3 73 62V66" stroke="#94A3B8" strokeWidth="1.5" />
              </g>
              <circle cx="50" cy="85" r="5" fill="#E2E8F0" />
              <circle cx="190" cy="45" r="4" fill="#E2E8F0" />
              <line x1="185" y1="95" x2="195" y2="95" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <line x1="190" y1="90" x2="190" y2="100" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Exact greytHR wording */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              POI window is not yet released
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-gray-500">
              The investment proof declaration window has not been opened by HR. Please check back when notified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
