"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import Link from "next/link";

export default function FormsListPage() {
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
        <span className="text-xs text-gray-500">Forms</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span
          className="inline-block rounded-sm shrink-0"
          style={{ width: 4, height: 22, background: "#F59E0B" }}
        />
        <h1 className="text-xl font-semibold text-gray-800">Forms</h1>
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
            <circle cx="45" cy="45" r="38" fill="#FFFBEB" />
            <rect
              x="27"
              y="20"
              width="36"
              height="50"
              rx="3"
              fill="#FEF3C7"
              stroke="#FCD34D"
              strokeWidth="1.5"
            />
            <rect x="33" y="29" width="24" height="5" rx="1.5" fill="#FDE68A" />
            <rect x="33" y="38" width="24" height="5" rx="1.5" fill="#FDE68A" />
            <rect x="33" y="47" width="16" height="5" rx="1.5" fill="#FDE68A" />
            <circle cx="68" cy="22" r="4" fill="#FEF3C7" />
            <circle cx="22" cy="68" r="3" fill="#FEF3C7" />
          </svg>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
            Nothing to show! No forms are currently available. Check back when
            HR publishes employee forms.
          </p>
        </div>
      </div>
    </div>
  );
}
