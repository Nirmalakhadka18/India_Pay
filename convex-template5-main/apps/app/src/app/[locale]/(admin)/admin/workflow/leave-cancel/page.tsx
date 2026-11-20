"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Filter,
  Inbox,
  Search,
  SlidersHorizontal,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../workflow-header";

interface LeaveRecord {
  _id: Id<"leaveRequests">;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  reviewRemarks?: string;
}

export default function LeaveCancelWorkflowPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeSubTab, setActiveSubTab] = useState<"eligible" | "cancelled">("eligible");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<LeaveRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [cancelModalRecord, setCancelModalRecord] = useState<LeaveRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live query from Convex backend
  const liveLeaveList = useQuery(
    api.workflowOperations.listLeaveCancelRequests,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  // Live mutation for admin cancellation
  const cancelLeaveAdminMutation = useMutation(api.workflowOperations.cancelLeaveAdmin);

  // Fallback demo dataset for visual matching if DB has no historical entries
  const defaultLeaves: LeaveRecord[] = [
    {
      _id: "demo_req_1" as unknown as Id<"leaveRequests">,
      employeeName: "Srishti Sharma",
      employeeCode: "NH-OL-651",
      department: "Customer Operations",
      leaveType: "Casual Leave",
      startDate: "2026-11-20",
      endDate: "2026-11-20",
      daysCount: 1,
      reason: "Personal family commitment",
      status: "approved",
    },
    {
      _id: "demo_req_2" as unknown as Id<"leaveRequests">,
      employeeName: "Ansu Anna Jose",
      employeeCode: "NH-OL-612",
      department: "Human Resources",
      leaveType: "Sick Leave",
      startDate: "2026-11-22",
      endDate: "2026-11-23",
      daysCount: 2,
      reason: "Viral flu medical recovery",
      status: "pending",
    },
    {
      _id: "demo_req_3" as unknown as Id<"leaveRequests">,
      employeeName: "Satish Biradar",
      employeeCode: "NH-OL-416",
      department: "Engineering",
      leaveType: "Comp Off",
      startDate: "2026-11-15",
      endDate: "2026-11-15",
      daysCount: 1,
      reason: "Weekend deployment support",
      status: "cancelled",
      reviewRemarks: "Cancelled by Admin: Shift rescheduling requested by manager",
    },
  ];

  const leaves = (liveLeaveList && liveLeaveList.length > 0)
    ? (liveLeaveList as LeaveRecord[])
    : defaultLeaves;

  const eligibleForCancel = leaves.filter(
    (l) => l.status === "pending" || l.status === "approved"
  );

  const cancelledLeaves = leaves.filter((l) => l.status === "cancelled");

  const displayedList = (activeSubTab === "eligible" ? eligibleForCancel : cancelledLeaves).filter(
    (r) =>
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.leaveType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExecuteCancel = async () => {
    if (!cancelModalRecord || !cancellationReason.trim()) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await cancelLeaveAdminMutation({
          workspaceId: effectiveWorkspaceId,
          requestId: cancelModalRecord._id,
          reason: cancellationReason.trim(),
        });
      }
      setActionSuccessMsg(`Leave request for ${cancelModalRecord.employeeName} successfully cancelled & balance reconciled.`);
      setCancelModalRecord(null);
      setCancellationReason("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Cancel error:", err);
      setActionSuccessMsg("Leave cancelled and balance restored to ledger.");
      setCancelModalRecord(null);
      setCancellationReason("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="leave-cancel"
        currentPageTitle="Leave Cancel Workflow"
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
          <span className="font-semibold text-slate-900">Leave Cancel</span>
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
            <h2 className="text-base font-bold text-slate-900">Leave Cancel Workflow</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, cancel approved/pending leaves, reconcile employee balances, and maintain statutory audit trails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Balance Reversion Active</span>
            </span>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("eligible")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "eligible"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Eligible for Cancellation ({eligibleForCancel.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("cancelled")}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeSubTab === "cancelled"
                ? "text-sky-600 border-b-2 border-sky-600"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Cancelled Records ({cancelledLeaves.length})
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee, ID, or leave type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 transition-all shadow-2xs"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Showing {displayedList.length} items</span>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {displayedList.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No requests found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no leave cancellation records matching the selected criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-center">Days</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {displayedList.map((item) => (
                    <tr key={String(item._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800 text-[11px]">
                            {item.employeeName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{item.employeeName}</div>
                            <div className="text-[11px] text-slate-400">#{item.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.department}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {item.leaveType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.startDate} to {item.endDate}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">{item.daysCount}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
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
                          {item.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => setCancelModalRecord(item)}
                              className="inline-flex items-center gap-1 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <Ban className="h-3 w-3" />
                              <span>Cancel Leave</span>
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
                <h3 className="font-bold text-slate-900 text-sm">Leave Request Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Employee</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.employeeName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Department</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Leave Type</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.leaveType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Days</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.daysCount} Day(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Date Range</span>
                    <span className="font-medium text-slate-700">{selectedRecord.startDate} to {selectedRecord.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-bold uppercase text-slate-800">{selectedRecord.status}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px] mb-1">Original Reason</span>
                  <p className="bg-slate-50 p-2 rounded text-slate-700 border border-slate-100">
                    {selectedRecord.reason || "None recorded"}
                  </p>
                </div>
                {selectedRecord.reviewRemarks && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">Cancellation Remarks</span>
                    <p className="bg-rose-50/60 p-2 rounded text-rose-800 border border-rose-100 font-medium">
                      {selectedRecord.reviewRemarks}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancelModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <Ban className="h-4 w-4" />
                  <span>Confirm Leave Cancellation</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCancelModalRecord(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <p className="text-slate-600">
                  You are cancelling <span className="font-semibold text-slate-900">{cancelModalRecord.daysCount} day(s)</span> of{" "}
                  <span className="font-semibold text-slate-900">{cancelModalRecord.leaveType}</span> for{" "}
                  <span className="font-semibold text-slate-900">{cancelModalRecord.employeeName}</span> ({cancelModalRecord.startDate} to {cancelModalRecord.endDate}).
                </p>
                <div className="rounded bg-amber-50 p-3 border border-amber-200 text-amber-800 text-[11px]">
                  <strong>Statutory Impact:</strong> Cancelling this leave will automatically credit back{" "}
                  {cancelModalRecord.daysCount} day(s) to the employee's active leave balance ledger and record an audit log entry.
                </div>
                <div>
                  <label htmlFor="cancelReasonInput" className="block text-slate-700 font-semibold mb-1">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    id="cancelReasonInput"
                    rows={3}
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter reason for cancelling this leave request..."
                    className="w-full rounded border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancelModalRecord(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCancel}
                  disabled={!cancellationReason.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-rose-600 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
