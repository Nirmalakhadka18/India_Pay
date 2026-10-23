"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DocumentCenterPage() {
  const { current: workspaceId, workspaces } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const payslips = useQuery(api.payroll.getMyPayslips, scoped);
  const workspaceFiles = useQuery(api.files.list, scoped);

  const [activeCategory, setActiveCategory] = useState<
    "all" | "policy" | "tax" | "payslips"
  >("all");

  const currentRole = workspaces.find((w) => w._id === workspaceId)?.role;
  const isAdmin = currentRole === "admin" || currentRole === "owner";

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  // Files uploaded in workspace storage
  const uploadedDocs = workspaceFiles ?? [];
  const policyDocs = uploadedDocs.filter((f) =>
    f.name.toLowerCase().includes("policy") ||
    f.name.toLowerCase().includes("handbook") ||
    f.name.toLowerCase().includes("code") ||
    f.name.toLowerCase().includes("guideline"),
  );
  const taxDocs = uploadedDocs.filter((f) =>
    f.name.toLowerCase().includes("tax") ||
    f.name.toLowerCase().includes("12bb") ||
    f.name.toLowerCase().includes("tds") ||
    f.name.toLowerCase().includes("form"),
  );

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-teal-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                Document Center
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Authorized personal records, published payslips, and company HR policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Document Vault
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeCategory === "all"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            All Documents
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("policy")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeCategory === "policy"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            HR Policies & Handbooks ({policyDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("tax")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeCategory === "tax"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Tax & Statutory Forms ({taxDocs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("payslips")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeCategory === "payslips"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Published Payslips ({payslips?.length ?? 0})
          </button>
        </div>

        {/* Notice for unconfigured policy documents */}
        {activeCategory !== "payslips" && uploadedDocs.length === 0 && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-primary/80 flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-primary">
                Company Policy Documents Not Configured
              </p>
              <p className="text-primary/60">
                Official employee handbook, POSH guidelines, and leave rule PDFs have not yet been uploaded for this workspace by the administrator. Once uploaded via workspace files, they will be directly downloadable here.
              </p>
              {isAdmin && (
                <p className="text-[11px] text-cyan-600 pt-1 font-medium">
                  Tip for Administrators: Upload policy PDFs under Files to make them accessible to all employees.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Documents Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Document Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Workspace Uploaded Files */}
              {activeCategory !== "payslips" &&
                uploadedDocs
                  .filter((doc) => {
                    if (activeCategory === "all") return true;
                    if (activeCategory === "policy") {
                      return (
                        doc.name.toLowerCase().includes("policy") ||
                        doc.name.toLowerCase().includes("handbook") ||
                        doc.name.toLowerCase().includes("code") ||
                        doc.name.toLowerCase().includes("guideline")
                      );
                    }
                    if (activeCategory === "tax") {
                      return (
                        doc.name.toLowerCase().includes("tax") ||
                        doc.name.toLowerCase().includes("12bb") ||
                        doc.name.toLowerCase().includes("tds")
                      );
                    }
                    return true;
                  })
                  .map((doc) => (
                    <tr key={doc._id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-3.5 font-medium text-primary flex items-center gap-3">
                        <FileText className="h-4 w-4 text-teal-600 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold">{doc.name}</p>
                          <p className="text-[10px] text-primary/50">
                            {(doc.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary/70 capitalize">
                        {doc.name.toLowerCase().includes("tax")
                          ? "Tax & Statutory"
                          : "HR Policy"}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary/60 font-mono">
                        {new Date(doc.createdAt).toISOString().slice(0, 10)}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={doc.name}
                          >
                            <Button variant="outline" size="sm" className="text-xs">
                              <Download className="mr-1.5 h-3.5 w-3.5" /> Download
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-primary/40">Unavailable</span>
                        )}
                      </td>
                    </tr>
                  ))}

              {/* Published Payslips listed in documents */}
              {(activeCategory === "all" || activeCategory === "payslips") &&
                payslips?.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/30 transition">
                    <td className="px-6 py-3.5 font-medium text-primary flex items-center gap-3">
                      <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">
                          Salary Slip - {p.periodMonth} (
                          {me?.firstName} {me?.lastName}).pdf
                        </p>
                        <p className="text-[10px] text-primary/50">
                          Net Pay: ₹{p.netSalary.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-primary/70">
                      Payroll Payslip
                    </td>
                    <td className="px-6 py-3.5 text-xs text-primary/60 font-mono">
                      {p.finalizedAt
                        ? new Date(p.finalizedAt).toISOString().slice(0, 10)
                        : "Processed"}
                    </td>
                    <td className="px-6 py-3.5 text-xs">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Published
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Link href="/salary">
                        <Button variant="outline" size="sm" className="text-xs">
                          <Download className="mr-1.5 h-3.5 w-3.5" /> View & Download
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}

              {/* Completely Empty State */}
              {((activeCategory === "payslips" && (!payslips || payslips.length === 0)) ||
                (activeCategory !== "payslips" &&
                  uploadedDocs.length === 0 &&
                  (!payslips || payslips.length === 0))) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-primary/50">
                    No documents available in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
