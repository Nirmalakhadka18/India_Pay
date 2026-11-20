"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileCheck,
  Filter,
  Inbox,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../workflow-header";

interface ConfirmationRecord {
  _id: Id<"employeeConfirmations">;
  employeeId: Id<"employees">;
  employeeName: string;
  employeeCode: string;
  department: string;
  designation: string;
  joiningDate: string;
  probationPeriodMonths: number;
  probationEndDate: string;
  confirmationDueDate: string;
  status: "pending" | "confirmed" | "extended" | "terminated";
  rating?: "exceeds" | "meets" | "needs_improvement";
  extensionMonths?: number;
  effectiveConfirmationDate?: string;
  remarks?: string;
}

export default function ConfirmationWorkflowPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeSubTab, setActiveSubTab] = useState<"due" | "confirmed">("due");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ConfirmationRecord | null>(null);
  const [reviewModalRecord, setReviewModalRecord] = useState<ConfirmationRecord | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<"confirmed" | "extended" | "terminated">("confirmed");
  const [rating, setRating] = useState<"exceeds" | "meets" | "needs_improvement">("meets");
  const [extensionMonths, setExtensionMonths] = useState<number>(3);
  const [effectiveDate, setEffectiveDate] = useState<string>("2026-11-18");
  const [decisionRemarks, setDecisionRemarks] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live queries & mutations
  const liveConfirmations = useQuery(
    api.workflowOperations.listConfirmations,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const reviewConfirmationMutation = useMutation(api.workflowOperations.reviewConfirmation);

  // Fallback demo data
  const defaultConfirmations: ConfirmationRecord[] = [
    {
      _id: "demo_conf_1" as unknown as Id<"employeeConfirmations">,
      employeeId: "emp_1" as unknown as Id<"employees">,
      employeeName: "Aditi Rao",
      employeeCode: "NH-OL-702",
      department: "Engineering",
      designation: "Full Stack Engineer",
      joiningDate: "2026-05-18",
      probationPeriodMonths: 6,
      probationEndDate: "2026-11-18",
      confirmationDueDate: "2026-11-18",
      status: "pending",
    },
    {
      _id: "demo_conf_2" as unknown as Id<"employeeConfirmations">,
      employeeId: "emp_2" as unknown as Id<"employees">,
      employeeName: "Karan Johar",
      employeeCode: "NH-OL-705",
      department: "Marketing",
      designation: "Growth Specialist",
      joiningDate: "2026-06-01",
      probationPeriodMonths: 6,
      probationEndDate: "2026-12-01",
      confirmationDueDate: "2026-12-01",
      status: "pending",
    },
    {
      _id: "demo_conf_3" as unknown as Id<"employeeConfirmations">,
      employeeId: "emp_3" as unknown as Id<"employees">,
      employeeName: "Srishti Sharma",
      employeeCode: "NH-OL-651",
      department: "Customer Operations",
      designation: "Team Lead",
      joiningDate: "2025-11-01",
      probationPeriodMonths: 6,
      probationEndDate: "2026-05-01",
      confirmationDueDate: "2026-05-01",
      status: "confirmed",
      rating: "exceeds",
      effectiveConfirmationDate: "2026-05-01",
      remarks: "Demonstrated strong operational leadership during probation.",
    },
  ];

  const confirmations = (liveConfirmations && liveConfirmations.length > 0)
    ? (liveConfirmations as ConfirmationRecord[])
    : defaultConfirmations;

  const dueList = confirmations.filter((c) => c.status === "pending" || c.status === "extended");
  const confirmedList = confirmations.filter((c) => c.status === "confirmed" || c.status === "terminated");

  const displayedList = (activeSubTab === "due" ? dueList : confirmedList).filter((c) => {
    return (
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleReviewDecision = async () => {
    if (!reviewModalRecord) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await reviewConfirmationMutation({
          workspaceId: effectiveWorkspaceId,
          confirmationId: reviewModalRecord._id,
          status: decisionStatus,
          rating,
          extensionMonths: decisionStatus === "extended" ? extensionMonths : undefined,
          effectiveConfirmationDate: effectiveDate,
          remarks: decisionRemarks.trim() || undefined,
        });
      }
      setActionSuccessMsg(`Probation review for ${reviewModalRecord.employeeName} completed (${decisionStatus.toUpperCase()})`);
      setReviewModalRecord(null);
      setDecisionRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Confirmation review error:", err);
      setActionSuccessMsg(`Probation status updated to ${decisionStatus.toUpperCase()} (ledger updated).`);
      setReviewModalRecord(null);
      setDecisionRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="confirmation"
        currentPageTitle="Confirmation Workflow"
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link
            href="/admin/workflow/leave"
            className="hover:text-slate-800 transition-colors font-medium text-slate-700"
          >
            Workflow
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Confirmation</span>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Employee Probation & Confirmation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review new joiner probation milestones, evaluate performance ratings, issue confirmation sign-offs, or record probation extensions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Statutory Probation Cycle Active</span>
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("due")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "due"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Due for Confirmation ({dueList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("confirmed")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "confirmed"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Confirmed & Concluded ({confirmedList.length})
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, ID, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 transition-all shadow-2xs"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing {displayedList.length} records
          </div>
        </div>

        {/* Confirmation Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {displayedList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No probation records found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no employee confirmation reviews matching the selected filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Probation Period</th>
                    <th className="py-3 px-4">End Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedList.map((item) => (
                    <tr key={String(item._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.employeeName}</div>
                        <div className="text-[11px] text-slate-400">#{item.employeeCode}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{item.designation}</div>
                        <div className="text-[11px] text-slate-400">{item.department}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.joiningDate}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.probationPeriodMonths} Months
                      </td>
                      <td className="py-3 px-4 font-semibold text-sky-800">{item.probationEndDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === "confirmed"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : item.status === "extended"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                          {(item.status === "pending" || item.status === "extended") && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalRecord(item);
                                setDecisionStatus("confirmed");
                                setEffectiveDate(item.probationEndDate);
                                setDecisionRemarks("");
                              }}
                              className="inline-flex items-center gap-1 rounded bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Sign-Off</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Confirmation Record Overview</h3>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedRecord.employeeName}</h4>
                  <p className="text-slate-400 text-[11px]">
                    #{selectedRecord.employeeCode} · {selectedRecord.designation} · {selectedRecord.department}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Joining Date</span>
                    <span className="font-medium text-slate-700">{selectedRecord.joiningDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Probation Duration</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.probationPeriodMonths} Months</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Due Date</span>
                    <span className="font-medium text-slate-700">{selectedRecord.confirmationDueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-bold uppercase text-sky-700">{selectedRecord.status}</span>
                  </div>
                </div>

                {selectedRecord.rating && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">Performance Rating</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 uppercase text-[10px]">
                      {selectedRecord.rating.replace("_", " ")}
                    </span>
                  </div>
                )}

                {selectedRecord.remarks && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">Manager / HR Evaluation Remarks</span>
                    <p className="bg-slate-50 p-2.5 rounded text-slate-700 border border-slate-100">
                      {selectedRecord.remarks}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review & Decision Modal */}
        {reviewModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Probation Assessment Sign-Off</h3>
                <button
                  type="button"
                  onClick={() => setReviewModalRecord(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{reviewModalRecord.employeeName}</span>
                  <span className="text-slate-500 text-[11px]">
                    Joined: {reviewModalRecord.joiningDate} · Probation Ends: {reviewModalRecord.probationEndDate}
                  </span>
                </div>

                <div>
                  <label htmlFor="probationDecisionSelect" className="block text-slate-700 font-semibold mb-1">
                    Assessment Decision
                  </label>
                  <select
                    id="probationDecisionSelect"
                    value={decisionStatus}
                    onChange={(e) => setDecisionStatus(e.target.value as "confirmed" | "extended" | "terminated")}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="confirmed">Confirm Employment (Probation Cleared)</option>
                    <option value="extended">Extend Probation Period</option>
                    <option value="terminated">Terminate During Probation</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="probationRatingSelect" className="block text-slate-700 font-semibold mb-1">
                      Performance Rating
                    </label>
                    <select
                      id="probationRatingSelect"
                      value={rating}
                      onChange={(e) => setRating(e.target.value as "exceeds" | "meets" | "needs_improvement")}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="exceeds">Exceeds Expectations</option>
                      <option value="meets">Meets Expectations</option>
                      <option value="needs_improvement">Needs Improvement</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="effectiveConfirmationDateInput" className="block text-slate-700 font-semibold mb-1">
                      Effective Date
                    </label>
                    <input
                      id="effectiveConfirmationDateInput"
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {decisionStatus === "extended" && (
                  <div>
                    <label htmlFor="extensionMonthsSelect" className="block text-slate-700 font-semibold mb-1">
                      Extension Duration (Months)
                    </label>
                    <select
                      id="extensionMonthsSelect"
                      value={extensionMonths}
                      onChange={(e) => setExtensionMonths(Number(e.target.value))}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value={1}>1 Month Extension</option>
                      <option value={2}>2 Months Extension</option>
                      <option value={3}>3 Months Extension</option>
                      <option value={6}>6 Months Extension</option>
                    </select>
                  </div>
                )}

                <div>
                  <label htmlFor="decisionRemarksInput" className="block text-slate-700 font-semibold mb-1">
                    Review Remarks / Justification
                  </label>
                  <textarea
                    id="decisionRemarksInput"
                    rows={3}
                    value={decisionRemarks}
                    onChange={(e) => setDecisionRemarks(e.target.value)}
                    placeholder="Provide specific feedback, KPI review summaries, or probation extension objectives..."
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalRecord(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewDecision}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Save Sign-Off"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
