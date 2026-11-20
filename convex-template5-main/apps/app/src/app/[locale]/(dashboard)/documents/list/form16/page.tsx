"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import Link from "next/link";

export default function Form16ListPage() {
  const { current: workspaceId } = useWorkspace();

  if (!workspaceId)
    return <div className="p-8 text-sm text-gray-400">Select a workspace.</div>;

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 px-6 py-6 md:px-10">
      <div className="flex items-center gap-2 mb-2">
        <Link
          href="/documents"
          className="text-xs text-blue-500 hover:underline"
        >
          Document Center
        </Link>
        <span className="text-xs text-gray-400">/</span>
        <span className="text-xs text-gray-500">Form 16</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span
          className="inline-block rounded-sm shrink-0"
          style={{ width: 4, height: 22, background: "#F59E0B" }}
        />
        <h1 className="text-xl font-semibold text-gray-800">Form 16</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            width="90"
            height="90"
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="mb-5"
          >
            <circle cx="45" cy="45" r="38" fill="#FFF1F2" />
            <rect
              x="27"
              y="22"
              width="36"
              height="46"
              rx="3"
              fill="#FEE2E2"
              stroke="#FCA5A5"
              strokeWidth="1.5"
            />
            <text
              x="45"
              y="42"
              textAnchor="middle"
              fontSize="12"
              fill="#EF4444"
              fontWeight="bold"
            >
              16
            </text>
            <line
              x1="33"
              y1="50"
              x2="57"
              y2="50"
              stroke="#FCA5A5"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="33"
              y1="56"
              x2="57"
              y2="56"
              stroke="#FCA5A5"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line
              x1="33"
              y1="62"
              x2="45"
              y2="62"
              stroke="#FCA5A5"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="68" cy="22" r="4" fill="#FEE2E2" />
            <circle cx="22" cy="68" r="3" fill="#FEE2E2" />
          </svg>
          <p className="font-semibold text-gray-700 mb-1">
            It&apos;s lonely here!
          </p>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Form 16 is issued annually after Q4 TDS return is filed. It will
            appear here once released by HR.
          </p>
        </div>
      </div>
    </div>
  );
}
