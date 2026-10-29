"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="mb-5">
        <circle cx="45" cy="45" r="38" fill="#F3F4F6" />
        <rect x="24" y="22" width="26" height="32" rx="2" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="1.5" />
        <rect x="33" y="28" width="26" height="32" rx="2" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5" />
        <line x1="38" y1="37" x2="54" y2="37" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="43" x2="54" y2="43" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="38" y1="49" x2="47" y2="49" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="68" cy="22" r="4" fill="#E0E7FF" />
        <circle cx="22" cy="68" r="3" fill="#E0E7FF" />
        <circle cx="72" cy="65" r="2" fill="#C7D2FE" />
      </svg>
      <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
        Nothing to show! No employee documents have been uploaded for you yet.
      </p>
    </div>
  );
}

export default function DocumentsListPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";
  const files = useQuery(api.files.list, scoped);

  if (!workspaceId) return <div className="p-8 text-sm text-gray-400">Select a workspace.</div>;

  const employeeDocs = (files ?? []).filter(
    (f) =>
      !f.name.toLowerCase().includes("policy") &&
      !f.name.toLowerCase().includes("handbook") &&
      !f.name.toLowerCase().includes("form16") &&
      !f.name.toLowerCase().includes("form 16") &&
      !f.name.toLowerCase().includes("tds")
  );

  return (
    <div className="flex h-full w-full flex-col bg-gray-50 px-6 py-6 md:px-10">
      <div className="flex items-center gap-2 mb-2">
        <Link href="/documents" className="text-xs text-blue-500 hover:underline">Document Center</Link>
        <span className="text-xs text-gray-400">/</span>
        <span className="text-xs text-gray-500">Documents</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <span className="inline-block rounded-sm shrink-0" style={{ width: 4, height: 22, background: "#F59E0B" }} />
        <h1 className="text-xl font-semibold text-gray-800">Documents</h1>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {files === undefined ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : employeeDocs.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employeeDocs.map((doc) => (
                <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">{doc.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{(doc.size / 1024).toFixed(1)} KB</td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" download={doc.name}>
                        <button type="button" className="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Unavailable</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
