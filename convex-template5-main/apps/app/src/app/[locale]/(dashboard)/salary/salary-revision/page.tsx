"use client";

import { useWorkspace } from "@/lib/useWorkspace";

export default function SalaryRevisionPage() {
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
          <h1 className="text-base font-semibold text-primary">Salary Revision</h1>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Large Bordered Content Box */}
        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          <div className="flex flex-col items-center justify-center text-center">
            {/* greytHR Salary Revision Empty State Illustration */}
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-4"
              aria-hidden="true"
            >
              <g transform="translate(65, 25)">
                {/* Board / Chart background */}
                <rect x="0" y="0" width="110" height="75" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2.5" />
                <path d="M15 60L40 40L65 50L95 22" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="95" cy="22" r="4" fill="#0091FF" />
                <circle cx="40" cy="40" r="3" fill="#94A3B8" />
                <circle cx="65" cy="50" r="3" fill="#94A3B8" />
                <line x1="15" y1="65" x2="95" y2="65" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
              </g>
              <circle cx="45" cy="85" r="5" fill="#E2E8F0" />
              <circle cx="195" cy="45" r="4" fill="#E2E8F0" />
              <line x1="185" y1="95" x2="195" y2="95" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              <line x1="190" y1="90" x2="190" y2="100" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
            </svg>

            {/* Exact greytHR wording */}
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Nothing to show!
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-400 dark:text-gray-500">
              Looks like your salary revision has not been generated yet. Drop by later and we&apos;ll have it ready for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
