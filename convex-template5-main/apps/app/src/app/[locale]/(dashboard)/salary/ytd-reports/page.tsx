"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState } from "react";

export default function YtdReportsPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);

  const [activeTab, setActiveTab] = useState<"ytd" | "pf">("ytd");
  const [financialYear, setFinancialYear] = useState("Apr 2026 - Mar 2027");

  const empName = me?.firstName ? `${me.firstName} ${me.lastName ?? ""}`.trim() : "Member";

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
          <h1 className="text-base font-semibold text-primary">YTD Reports</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Centered Segmented Selector */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-md shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("ytd")}
              className={`rounded-l-md px-8 py-2 text-xs font-semibold transition ${
                activeTab === "ytd"
                  ? "bg-[#0091FF] text-white shadow-xs"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300"
              }`}
            >
              YTD Statement
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pf")}
              className={`rounded-r-md border border-l-0 border-gray-200 px-8 py-2 text-xs font-semibold transition dark:border-border ${
                activeTab === "pf"
                  ? "border-[#0091FF] bg-[#0091FF] text-white shadow-xs"
                  : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-card dark:text-gray-300"
              }`}
            >
              PF YTD Statement
            </button>
          </div>
        </div>

        {/* Large Bordered Content Box */}
        <div className="relative flex min-h-[460px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          {/* Top Right Financial Year Dropdown */}
          <div className="absolute top-4 right-4">
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
            >
              <option value="Apr 2026 - Mar 2027">Apr 2026 - Mar 2027</option>
              <option value="Apr 2025 - Mar 2026">Apr 2025 - Mar 2026</option>
            </select>
          </div>

          {/* greytHR Empty State Illustration */}
          <div className="flex flex-col items-center justify-center text-center">
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-2"
              aria-hidden="true"
            >
              <g transform="translate(60, 20)">
                <rect x="0" y="0" width="80" height="70" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <rect x="6" y="6" width="68" height="58" rx="3" fill="#F8FAFC" />
                <circle cx="40" cy="30" r="11" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
                <path d="M26 52C26 44 32 40 40 40C48 40 54 44 54 52" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 70V80H50V70" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M15 80H65" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
              </g>
              <g transform="translate(110, 48)">
                <path d="M10 0H45C50 0 55 4 55 9V45C55 52 48 57 40 57H20C12 57 8 52 8 45V15" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <path d="M0 12C0 5 6 0 13 0H35V45C35 48 33 50 30 50H15C8 50 0 45 0 38V12Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <line x1="16" y1="18" x2="38" y2="18" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="26" x2="38" y2="26" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="34" x2="34" y2="34" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <path d="M15 50C22 50 30 54 35 60H5C0 56 6 50 15 50Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" />
              </g>
              <circle cx="48" cy="88" r="6" stroke="#CBD5E1" strokeWidth="2" fill="#FFFFFF" />
              <circle cx="36" cy="100" r="4" stroke="#CBD5E1" strokeWidth="1.5" fill="#FFFFFF" />
              <circle cx="180" cy="35" r="3" fill="#CBD5E1" />
              <circle cx="40" cy="30" r="3" fill="#CBD5E1" />
              <line x1="190" y1="95" x2="198" y2="95" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <line x1="194" y1="91" x2="194" y2="99" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Exact greytHR YTD wording */}
            <p className="mt-4 max-w-lg text-sm text-gray-400 dark:text-gray-500">
              Hi {empName}, looks like your {activeTab === "ytd" ? "YTD Statement" : "PF YTD Statement"} has not been generated yet, Drop by later and we&apos;ll have it ready for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
