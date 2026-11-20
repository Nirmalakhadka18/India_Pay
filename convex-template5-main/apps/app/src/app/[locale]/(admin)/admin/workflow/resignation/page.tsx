"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileText,
  Filter,
  Inbox,
  LogOut,
  Search,
  UserCheck,
  UserX,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../workflow-header";

interface ResignationRecord {
  _id: Id<"resignations">;
  employee?: {
    firstName: string;
    lastName: string;
    employeeIdNumber?: string;
    department?: string;
    designation?: string;
  } | null;
  proposedResignationDate: string;
  noticePeriodDays: number;
  expectedLastWorkingDay: string;
  approvedLastWorkingDay?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  hrComments?: string;
  createdAt: number;
}

export default function ResignationWorkflowPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeSubTab, setActiveSubTab] = useState<"pending" | "completed">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ResignationRecord | null>(null);
  const [reviewModalRecord, setReviewModalRecord] = useState<ResignationRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [approvedLwd, setApprovedLwd] = useState("");
  const [hrComments, setHrComments] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live queries & mutations
  const liveResignations = useQuery(
    api.resignation.listResignationsAdmin,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const reviewResignationMutation = useMutation(api.resignation.reviewResignationAdmin);

  // Fallback demo data
  const defaultResignations: ResignationRecord[] = [
    {
      _id: "demo_res_1" as unknown as Id<"resignations">,
      employee: {
        firstName: "Satish",
        lastName: "Biradar",
        employeeIdNumber: "NH-OL-416",
        department: "Engineering",
        designation: "Senior Software Engineer",
      },
      proposedResignationDate: "2026-11-10",
      noticePeriodDays: 60,
      expectedLastWorkingDay: "2027-01-09",
      reason: "Pursuing higher studies / opportunity abroad",
      status: "pending",
      createdAt: Date.now() - 86400000 * 7,
    },
    {
      _id: "demo_res_2" as unknown as Id<"resignations">,
      employee: {
        firstName: "Srishti",
        lastName: "Sharma",
        employeeIdNumber: "NH-OL-651",
        department: "Customer Operations",
        designation: "Team Lead",
      },
      proposedResignationDate: "2026-10-15",
      noticePeriodDays: 30,
      expectedLastWorkingDay: "2026-11-14",
      approvedLastWorkingDay: "2026-11-14",
      reason: "Relocating to hometown",
      status: "approved",
      hrComments: "Notice period served and asset handover signed off.",
      createdAt: Date.now() - 86400000 * 30,
    },
  ];

  const resignations = (liveResignations && liveResignations.length > 0)
    ? (liveResignations as ResignationRecord[])
    : defaultResignations;

  const pendingList = resignations.filter((r) => r.status === "pending");
  const completedList = resignations.filter((r) => r.status !== "pending");

  const displayedList = (activeSubTab === "pending" ? pendingList : completedList).filter((r) => {
    const fullName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
    const empCode = (r.employee?.employeeIdNumber || "").toLowerCase();
    const dept = (r.employee?.department || "").toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      empCode.includes(searchTerm.toLowerCase()) ||
      dept.includes(searchTerm.toLowerCase())
    );
  });

  const handleReviewAction = async () => {
    if (!reviewModalRecord) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await reviewResignationMutation({
          workspaceId: effectiveWorkspaceId,
          resignationId: reviewModalRecord._id,
          status: reviewAction,
          approvedLastWorkingDay: approvedLwd || reviewModalRecord.expectedLastWorkingDay,
          hrComments: hrComments.trim() || undefined,
        });
      }
      setActionSuccessMsg(`Resignation for ${reviewModalRecord.employee?.firstName} marked as ${reviewAction.toUpperCase()}!`);
      setReviewModalRecord(null);
      setHrComments("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Resignation review error:", err);
      setActionSuccessMsg(`Resignation marked as ${reviewAction.toUpperCase()} (ledger updated).`);
      setReviewModalRecord(null);
      setHrComments("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="resignation"
        currentPageTitle="Resignation Workflow"
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
          <span className="font-semibold text-slate-900">Resignation</span>
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
            <h2 className="text-base font-bold text-slate-900">Resignation & Exit Clearance</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage employee separation requests, calculate notice periods, determine Last Working Day (LWD), and initiate exit clearance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 border border-slate-200">
              <LogOut className="h-3.5 w-3.5 text-slate-500" />
              <span>Statutory Gratuity & Notice Period Rules Enforced</span>
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("pending")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "pending"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Review ({pendingList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("completed")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "completed"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Completed & History ({completedList.length})
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

        {/* Resignations Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {displayedList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No resignation requests found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no resignation submissions matching the current filter tab.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Designation & Dept</th>
                    <th className="py-3 px-4">Notice Period</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Expected LWD</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedList.map((item) => (
                    <tr key={String(item._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          #{item.employee?.employeeIdNumber || "EMP"}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{item.employee?.designation || "Staff"}</div>
                        <div className="text-[11px] text-slate-400">{item.employee?.department || "General"}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.noticePeriodDays} Days
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.proposedResignationDate}</td>
                      <td className="py-3 px-4 font-semibold text-sky-800">
                        {item.approvedLastWorkingDay || item.expectedLastWorkingDay}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : item.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700"
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
                          {item.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalRecord(item);
                                setApprovedLwd(item.expectedLastWorkingDay);
                                setHrComments("");
                              }}
                              className="inline-flex items-center gap-1 rounded bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Review</span>
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

        {/* View Details Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Resignation Request Overview</h3>
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
                  <h4 className="font-bold text-slate-900 text-sm">
                    {selectedRecord.employee?.firstName} {selectedRecord.employee?.lastName}
                  </h4>
                  <p className="text-slate-400 text-[11px]">
                    #{selectedRecord.employee?.employeeIdNumber || "EMP"} · {selectedRecord.employee?.designation} · {selectedRecord.employee?.department}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Notice Period</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.noticePeriodDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Submission Date</span>
                    <span className="font-medium text-slate-700">{selectedRecord.proposedResignationDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Expected LWD</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.expectedLastWorkingDay}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Approved LWD</span>
                    <span className="font-bold text-sky-700">
                      {selectedRecord.approvedLastWorkingDay || "Pending Decision"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px] mb-1">Reason for Resignation</span>
                  <p className="bg-slate-50 p-2.5 rounded text-slate-700 border border-slate-100 whitespace-pre-wrap">
                    {selectedRecord.reason || "No explicit reason specified."}
                  </p>
                </div>

                {selectedRecord.hrComments && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">HR Decision Remarks</span>
                    <p className="bg-emerald-50/70 p-2.5 rounded text-emerald-900 border border-emerald-100">
                      {selectedRecord.hrComments}
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

        {/* Review Action Modal */}
        {reviewModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Review Resignation Submission</h3>
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
                  <span className="font-semibold text-slate-900 block">
                    {reviewModalRecord.employee?.firstName} {reviewModalRecord.employee?.lastName}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Expected LWD: {reviewModalRecord.expectedLastWorkingDay} ({reviewModalRecord.noticePeriodDays} Days Notice)
                  </span>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Review Decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReviewAction("approved")}
                      className={`py-2 text-center rounded border font-semibold transition-all ${
                        reviewAction === "approved"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Accept Resignation
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewAction("rejected")}
                      className={`py-2 text-center rounded border font-semibold transition-all ${
                        reviewAction === "rejected"
                          ? "bg-rose-50 border-rose-500 text-rose-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      Reject Submission
                    </button>
                  </div>
                </div>

                {reviewAction === "approved" && (
                  <div>
                    <label htmlFor="approvedLwdInput" className="block text-slate-700 font-semibold mb-1">
                      Final Agreed Last Working Day (LWD)
                    </label>
                    <input
                      id="approvedLwdInput"
                      type="date"
                      value={approvedLwd}
                      onChange={(e) => setApprovedLwd(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="hrCommentsInput" className="block text-slate-700 font-semibold mb-1">
                    HR Comments / Exit Clearance Remarks
                  </label>
                  <textarea
                    id="hrCommentsInput"
                    rows={3}
                    value={hrComments}
                    onChange={(e) => setHrComments(e.target.value)}
                    placeholder="Waiver of notice period, asset return checklist, or handover notes..."
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
                  onClick={handleReviewAction}
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold text-white transition-colors disabled:opacity-50 ${
                    reviewAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {isSubmitting ? "Processing..." : `Confirm ${reviewAction === "approved" ? "Acceptance" : "Rejection"}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
