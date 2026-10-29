"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import Link from "next/link";

function HeroBannerIllustration() {
  return (
    <svg viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full" aria-hidden="true">
      <rect x="55" y="20" width="120" height="90" rx="4" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
      <rect x="63" y="30" width="104" height="72" rx="2" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <polyline points="75,90 95,70 115,78 140,52 155,60" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="75" y1="95" x2="160" y2="95" stroke="#D1D5DB" strokeWidth="1" />
      <line x1="115" y1="110" x2="115" y2="130" stroke="#9CA3AF" strokeWidth="2" />
      <line x1="100" y1="130" x2="130" y2="130" stroke="#9CA3AF" strokeWidth="2" />
      <circle cx="42" cy="98" r="10" fill="#C7D2FE" stroke="#818CF8" strokeWidth="1.5" />
      <path d="M30 138 Q42 123 54 138" stroke="#4338CA" strokeWidth="2" fill="#C7D2FE" />
      <line x1="50" y1="110" x2="63" y2="93" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="138" x2="34" y2="158" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="138" x2="50" y2="158" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="33" cy="159" rx="5" ry="2.5" fill="#1E1B4B" />
      <ellipse cx="51" cy="159" rx="5" ry="2.5" fill="#1E1B4B" />
      <circle cx="172" cy="22" r="3" fill="#E0E7FF" />
      <circle cx="186" cy="38" r="2" fill="#C7D2FE" />
      <circle cx="28" cy="68" r="2.5" fill="#E0E7FF" />
    </svg>
  );
}

function IconDocuments() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="2" width="14" height="18" rx="2" fill="#EEF2FF" stroke="#6366F1" strokeWidth="1.5" />
      <rect x="8" y="6" width="12" height="18" rx="2" fill="#E0E7FF" stroke="#818CF8" strokeWidth="1.5" />
      <line x1="11" y1="13" x2="20" y2="13" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="17" x2="20" y2="17" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11" y1="21" x2="16" y2="21" stroke="#6366F1" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPayslips() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="3" width="18" height="22" rx="2" fill="#F0FDF4" stroke="#22C55E" strokeWidth="1.5" />
      <line x1="9" y1="10" x2="19" y2="10" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="14" x2="19" y2="14" stroke="#86EFAC" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="18" x2="14" y2="18" stroke="#86EFAC" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconForm16() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="3" width="18" height="22" rx="2" fill="#FFF1F2" stroke="#F87171" strokeWidth="1.5" />
      <text x="14" y="13.5" textAnchor="middle" fontSize="7" fill="#EF4444" fontWeight="bold">16</text>
      <line x1="9" y1="17" x2="19" y2="17" stroke="#FCA5A5" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="20" x2="19" y2="20" stroke="#FCA5A5" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="23" x2="14" y2="23" stroke="#FCA5A5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPolicies() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="4" width="20" height="20" rx="2" fill="#F0FDFA" stroke="#14B8A6" strokeWidth="1.5" />
      <path d="M8 14 L12 18 L20 10" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconForms() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="5" y="3" width="18" height="22" rx="2" fill="#FFFBEB" stroke="#F59E0B" strokeWidth="1.5" />
      <rect x="8" y="8" width="12" height="2.5" rx="1" fill="#FDE68A" />
      <rect x="8" y="13" width="12" height="2.5" rx="1" fill="#FDE68A" />
      <rect x="8" y="18" width="8" height="2.5" rx="1" fill="#FDE68A" />
    </svg>
  );
}

const CATEGORIES = [
  { id: "documents", label: "Documents", icon: <IconDocuments />, href: "/documents/list/documents" },
  { id: "payslips", label: "Payslips", icon: <IconPayslips />, href: "/documents/list/payslips" },
  { id: "form16", label: "Form 16", icon: <IconForm16 />, href: "/documents/list/form16" },
  { id: "policies", label: "Company Policies", icon: <IconPolicies />, href: "/documents/list/policies" },
  { id: "forms", label: "Forms", icon: <IconForms />, href: "/documents/list/forms" },
] as const;

export default function DocumentCenterPage() {
  const { current: workspaceId } = useWorkspace();

  if (!workspaceId) {
    return <div className="p-8 text-sm text-gray-400">Select a workspace.</div>;
  }

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 px-6 py-6 md:px-10">
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-block rounded-sm shrink-0" style={{ width: 4, height: 22, background: "#F59E0B" }} />
        <h1 className="text-xl font-semibold text-gray-800">Document Center</h1>
      </div>

      <div className="relative flex items-center justify-between rounded-lg border border-gray-200 bg-white px-8 py-6 mb-6 overflow-hidden" style={{ minHeight: 140 }}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">We&apos;ve got it sorted for you!</h2>
          <p className="text-sm text-gray-500">All Documents are now in one place..</p>
        </div>
        <div className="absolute right-6 top-0 bottom-0 flex items-center pointer-events-none" style={{ width: 200 }}>
          <HeroBannerIllustration />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3">
              {cat.icon}
              <span className="text-sm font-medium text-gray-700">{cat.label}</span>
            </div>
            <Link href={cat.href} className="text-sm font-medium text-blue-500 hover:text-blue-600 hover:underline whitespace-nowrap">
              View All
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
