"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { useState } from "react";

export default function ReimbursementPage() {
  const { current: workspaceId } = useWorkspace();
  const [financialYear, setFinancialYear] = useState("Apr 2026 - Mar 2027");

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
          <h1 className="text-base font-semibold text-primary">Reimbursement</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Controls row: Tab on left, Financial Year selector on right */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-border">
          <div className="flex">
            <button
              type="button"
              className="relative pb-3 text-sm font-semibold text-[#0091FF]"
            >
              Overview
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
            </button>
          </div>

          <div className="pb-2">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
            >
              <option value="Apr 2026 - Mar 2027">Apr 2026 - Mar 2027</option>
              <option value="Apr 2025 - Mar 2026">Apr 2025 - Mar 2026</option>
            </select>
          </div>
        </div>

        {/* Large Bordered Content Box */}
        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          <div className="flex flex-col items-center justify-center text-center">
            {/* greytHR Blank / Empty State Illustration */}
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-4"
              aria-hidden="true"
            >
              <g transform="translate(75, 25)">
                {/* Receipt and card illustration */}
                <rect x="0" y="0" width="90" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <path d="M15 15H75M15 28H60M15 41H45M15 54H75" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <circle cx="70" cy="40" r="12" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
                <path d="M70 33V47M64 40H76" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
              </g>
              <circle cx="50" cy="85" r="5" fill="#E2E8F0" />
              <circle cx="190" cy="45" r="4" fill="#E2E8F0" />
              <line x1="185" y1="95" x2="195" y2="95" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <line x1="190" y1="90" x2="190" y2="100" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            </svg>

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nothing to show!
            </h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              No reimbursement records found for {financialYear}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
