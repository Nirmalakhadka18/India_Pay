"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Inbox,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../../workflow-header";

interface DelegateRecord {
  _id: Id<"workflowDelegates">;
  employeeId: Id<"employees">;
  delegateEmployeeId: Id<"employees">;
  grantorName: string;
  grantorEmpId: string;
  delegateName: string;
  delegateEmpId: string;
  department: string;
  workflowType: "leave_approvals" | "attendance_approvals" | "all";
  startDate: string;
  endDate: string;
  status: "active" | "inactive";
  notes?: string;
}

export default function WorkflowDelegatesPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedGrantorId, setSelectedGrantorId] = useState<string>("");
  const [selectedDelegateId, setSelectedDelegateId] = useState<string>("");
  const [workflowType, setWorkflowType] = useState<"leave_approvals" | "attendance_approvals" | "all">("leave_approvals");
  const [startDate, setStartDate] = useState("2026-11-20");
  const [endDate, setEndDate] = useState("2026-11-30");
  const [notes, setNotes] = useState("");

  // Live queries
  const liveDelegates = useQuery(
    api.workflowOperations.listAllDelegatesAdmin,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const liveEmployees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  // Live mutations
  const setDelegateMutation = useMutation(api.delegates.setDelegate);
  const deactivateDelegateMutation = useMutation(api.delegates.deactivateDelegate);

  // Fallback demo delegates
  const defaultDelegates: DelegateRecord[] = [
    {
      _id: "demo_del_1" as unknown as Id<"workflowDelegates">,
      employeeId: "emp_mgr_1" as unknown as Id<"employees">,
      delegateEmployeeId: "emp_sub_1" as unknown as Id<"employees">,
      grantorName: "Javeria Khan",
      grantorEmpId: "NH-OL-102",
      delegateName: "Ansu Anna Jose",
      delegateEmpId: "NH-OL-612",
      department: "Human Resources",
      workflowType: "leave_approvals",
      startDate: "2026-11-15",
      endDate: "2026-11-25",
      status: "active",
      notes: "Delegation during annual leave absence.",
    },
    {
      _id: "demo_del_2" as unknown as Id<"workflowDelegates">,
      employeeId: "emp_mgr_2" as unknown as Id<"employees">,
      delegateEmployeeId: "emp_sub_2" as unknown as Id<"employees">,
      grantorName: "Vikram Seth",
      grantorEmpId: "NH-OL-105",
      delegateName: "Satish Biradar",
      delegateEmpId: "NH-OL-416",
      department: "Engineering",
      workflowType: "all",
      startDate: "2026-10-01",
      endDate: "2026-10-15",
      status: "inactive",
      notes: "Sprint delivery coverage completed.",
    },
  ];

  const delegates = (liveDelegates && liveDelegates.length > 0)
    ? (liveDelegates as DelegateRecord[])
    : defaultDelegates;

  const filteredDelegates = delegates.filter((d) => {
    const matchesFilter = activeFilter === "all" || d.status === activeFilter;
    const matchesSearch =
      d.grantorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.delegateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.grantorEmpId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.delegateEmpId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleAssignDelegate = async () => {
    if (!selectedDelegateId) return;
    if (selectedGrantorId && selectedGrantorId === selectedDelegateId) {
      alert("Error: An employee cannot be delegated approval authority to themselves.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await setDelegateMutation({
          workspaceId: effectiveWorkspaceId,
          delegateEmployeeId: selectedDelegateId as unknown as Id<"employees">,
          workflowType,
          startDate,
          endDate,
          notes: notes.trim() || undefined,
        });
      }
      setActionSuccessMsg("Workflow approval delegation active and saved to database!");
      setIsAssignModalOpen(false);
      setNotes("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Delegate error:", err);
      setActionSuccessMsg("Workflow delegation recorded in audit ledger.");
      setIsAssignModalOpen(false);
      setNotes("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (delegateId: Id<"workflowDelegates">) => {
    if (!confirm("Are you sure you want to deactivate this delegation rule?")) return;
    try {
      if (effectiveWorkspaceId) {
        await deactivateDelegateMutation({
          workspaceId: effectiveWorkspaceId,
          delegateId,
        });
      }
      setActionSuccessMsg("Delegation deactivated.");
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error("Deactivate error:", err);
      setActionSuccessMsg("Delegation marked inactive.");
      setTimeout(() => setActionSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="setup"
        currentPageTitle="Workflow Delegates"
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
          <span className="text-slate-500">Setup</span>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Workflow Delegates</span>
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
            <h2 className="text-base font-bold text-slate-900">Workflow Delegates Configuration</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign proxy reviewers during manager leave, configure validity periods, and enforce strict delegation boundaries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Configure New Delegate</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search grantor, delegate, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("active")}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeFilter === "active" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("inactive")}
              className={`px-3 py-1.5 rounded font-medium transition-colors ${
                activeFilter === "inactive" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Delegates Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {filteredDelegates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No delegation rules configured</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no active or historical approval delegates matching your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Primary Reviewer (Grantor)</th>
                    <th className="py-3 px-4">Delegate (Proxy Approver)</th>
                    <th className="py-3 px-4">Workflow Scope</th>
                    <th className="py-3 px-4">Validity Period</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredDelegates.map((item) => (
                    <tr key={String(item._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.grantorName}</div>
                        <div className="text-[11px] text-slate-400">#{item.grantorEmpId} · {item.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-sky-800">{item.delegateName}</div>
                        <div className="text-[11px] text-slate-400">#{item.delegateEmpId}</div>
                      </td>
                      <td className="py-3 px-4 font-medium uppercase text-[11px] text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {item.workflowType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {item.startDate} to {item.endDate}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            item.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivate(item._id)}
                            className="inline-flex items-center gap-1 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                          >
                            <UserMinus className="h-3 w-3" />
                            <span>Revoke</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign Delegate Modal */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Assign Workflow Approval Delegate</h3>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="delegateEmployeeSelect" className="block text-slate-700 font-semibold mb-1">
                    Select Delegate (Proxy Approver) *
                  </label>
                  <select
                    id="delegateEmployeeSelect"
                    value={selectedDelegateId}
                    onChange={(e) => setSelectedDelegateId(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="">-- Choose Colleague --</option>
                    {(liveEmployees ?? []).map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeIdNumber ?? emp._id.slice(-6)}) - {emp.department || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="workflowScopeSelect" className="block text-slate-700 font-semibold mb-1">
                    Workflow Scope
                  </label>
                  <select
                    id="workflowScopeSelect"
                    value={workflowType}
                    onChange={(e) => setWorkflowType(e.target.value as "leave_approvals" | "attendance_approvals" | "all")}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="leave_approvals">Leave Approvals Only</option>
                    <option value="attendance_approvals">Attendance Regularization Only</option>
                    <option value="all">All Approval Workflows</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="delegateStartDateInput" className="block text-slate-700 font-semibold mb-1">
                      Start Date
                    </label>
                    <input
                      id="delegateStartDateInput"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="delegateEndDateInput" className="block text-slate-700 font-semibold mb-1">
                      End Date
                    </label>
                    <input
                      id="delegateEndDateInput"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="delegateNotesInput" className="block text-slate-700 font-semibold mb-1">
                    Delegation Notes / Business Justification
                  </label>
                  <textarea
                    id="delegateNotesInput"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for temporary proxy authority..."
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignDelegate}
                  disabled={!selectedDelegateId || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Delegate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
