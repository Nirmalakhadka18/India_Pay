"use client";

import { useWorkspace } from "@/lib/useWorkspace";

export default function LoansAndAdvancesPage() {
  const { current: workspaceId } = useWorkspace();

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
          <h1 className="text-base font-semibold text-primary">
            Loans and Advances
          </h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Tab Row */}
        <div className="border-b border-gray-200 dark:border-border">
          <button
            type="button"
            className="relative pb-3 text-sm font-semibold text-[#0091FF]"
          >
            My Loan
            <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-sm bg-[#0091FF]" />
          </button>
        </div>

        {/* Large Bordered Content Box */}
        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          <div className="flex flex-col items-center justify-center text-center">
            {/* greytHR Loan Illustration */}
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-4"
              aria-hidden="true"
            >
              <g transform="translate(70, 25)">
                <rect
                  x="0"
                  y="0"
                  width="100"
                  height="70"
                  rx="8"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
                <circle
                  cx="50"
                  cy="35"
                  r="18"
                  fill="#F8FAFC"
                  stroke="#94A3B8"
                  strokeWidth="2"
                />
                <path
                  d="M50 24V46M44 30H56M44 40H56"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M20 70V80H80V70" stroke="#CBD5E1" strokeWidth="2.5" />
                <path
                  d="M10 80H90"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="50" cy="85" r="5" fill="#E2E8F0" />
              <circle cx="190" cy="45" r="4" fill="#E2E8F0" />
              <line
                x1="185"
                y1="95"
                x2="195"
                y2="95"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="190"
                y1="90"
                x2="190"
                y2="100"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Exact greytHR Loans & Advances Wording */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nothing to show!
            </h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Your loan details will show up here after approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
