"use client";

import { useWorkspace } from "@/lib/useWorkspace";

export default function ItDeclarationPage() {
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
            IT Declaration
          </h1>
        </div>

        {/* Upper Right Action: My Tax Planner */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              // Informative notification matching greytHR locked behavior
              alert(
                "Declaration window is currently closed. Please wait for the admin notification.",
              );
            }}
            className="rounded-md bg-[#0091FF] px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-600"
          >
            My Tax Planner
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col p-6 md:p-8 space-y-4">
        {/* Large Bordered Content Box */}
        <div className="flex min-h-[460px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
          <div className="flex flex-col items-center justify-center text-center">
            {/* greytHR IT Declaration Document Illustration */}
            <svg
              width="240"
              height="160"
              viewBox="0 0 240 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="select-none mb-4"
              aria-hidden="true"
            >
              <g transform="translate(85, 20)">
                <rect
                  x="0"
                  y="0"
                  width="70"
                  height="96"
                  rx="8"
                  fill="#FFFFFF"
                  stroke="#CBD5E1"
                  strokeWidth="2.5"
                />
                <text
                  x="14"
                  y="44"
                  fontFamily="sans-serif"
                  fontSize="26"
                  fontWeight="bold"
                  fill="#CBD5E1"
                >
                  %
                </text>
                <line
                  x1="42"
                  y1="28"
                  x2="56"
                  y2="28"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="42"
                  y1="36"
                  x2="56"
                  y2="36"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="14"
                  y1="58"
                  x2="56"
                  y2="58"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="14"
                  y1="68"
                  x2="56"
                  y2="68"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="14"
                  y1="78"
                  x2="44"
                  y2="78"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </g>
              <circle cx="50" cy="98" r="5" fill="#E2E8F0" />
              <circle cx="60" cy="85" r="3" fill="#E2E8F0" />
              <line
                x1="55"
                y1="45"
                x2="65"
                y2="45"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="175"
                y1="65"
                x2="185"
                y2="65"
                stroke="#CBD5E1"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>

            {/* Exact greytHR IT Declaration Wording */}
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
              Declaration window is not open
            </h3>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Please wait for the admin notification
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
