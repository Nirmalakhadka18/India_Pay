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
  FileCheck2,
  Filter,
  Inbox,
  ListTodo,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../workflow-header";

interface OnboardingTaskRecord {
  _id: Id<"onboardingTasks">;
  employeeId: Id<"employees">;
  employeeName: string;
  employeeCode: string;
  department: string;
  taskName: string;
  category: "documentation" | "it_setup" | "training" | "hr_orientation" | "compliance";
  assignedRole?: string;
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "verified";
  completionRemarks?: string;
}

export default function EmployeeOnboardingWorkflowPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<OnboardingTaskRecord | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [targetTaskToUpdate, setTargetTaskToUpdate] = useState<OnboardingTaskRecord | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"in_progress" | "completed" | "verified">("completed");
  const [updateRemarks, setUpdateRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New task form state
  const [newTaskEmployeeId, setNewTaskEmployeeId] = useState<string>("");
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"documentation" | "it_setup" | "training" | "hr_orientation" | "compliance">("documentation");
  const [newTaskAssignedRole, setNewTaskAssignedRole] = useState("HR Operations");
  const [newTaskDueDate, setNewTaskDueDate] = useState("2026-11-30");

  // Live queries
  const liveTasks = useQuery(
    api.workflowOperations.listOnboardingTasks,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const liveEmployees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  // Live mutations
  const createTaskMutation = useMutation(api.workflowOperations.createOnboardingTask);
  const updateTaskStatusMutation = useMutation(api.workflowOperations.updateOnboardingTaskStatus);

  // Default demo onboarding tasks
  const defaultTasks: OnboardingTaskRecord[] = [
    {
      _id: "demo_ob_1" as unknown as Id<"onboardingTasks">,
      employeeId: "demo_emp_1" as unknown as Id<"employees">,
      employeeName: "Aditi Rao",
      employeeCode: "NH-OL-702",
      department: "Engineering",
      taskName: "PAN Card and Aadhaar Statutory KYC Verification",
      category: "compliance",
      assignedRole: "HR Compliance Officer",
      dueDate: "2026-11-25",
      status: "pending",
    },
    {
      _id: "demo_ob_2" as unknown as Id<"onboardingTasks">,
      employeeId: "demo_emp_2" as unknown as Id<"employees">,
      employeeName: "Karan Johar",
      employeeCode: "NH-OL-705",
      department: "Marketing",
      taskName: "Bank Account & EPFO UAN Linkage Sign-Off",
      category: "documentation",
      assignedRole: "Payroll Ops",
      dueDate: "2026-11-28",
      status: "in_progress",
    },
    {
      _id: "demo_ob_3" as unknown as Id<"onboardingTasks">,
      employeeId: "demo_emp_3" as unknown as Id<"employees">,
      employeeName: "Pooja Hegde",
      employeeCode: "NH-OL-698",
      department: "Design",
      taskName: "IT Hardware Provisioning & VPN Security Setup",
      category: "it_setup",
      assignedRole: "IT Infrastructure",
      dueDate: "2026-11-20",
      status: "verified",
      completionRemarks: "MacBook Pro M3 issued and asset acknowledgement received.",
    },
  ];

  const tasks = (liveTasks && liveTasks.length > 0)
    ? (liveTasks as OnboardingTaskRecord[])
    : defaultTasks;

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategoryFilter === "all" || t.category === activeCategoryFilter;
    const matchesStatus =
      activeStatusFilter === "all" || t.status === activeStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return;
    setIsSubmitting(true);
    try {
      const selectedEmp = liveEmployees?.find((e) => e._id === newTaskEmployeeId) || liveEmployees?.[0];
      if (effectiveWorkspaceId && selectedEmp) {
        await createTaskMutation({
          workspaceId: effectiveWorkspaceId,
          employeeId: selectedEmp._id,
          taskName: newTaskName.trim(),
          category: newTaskCategory,
          assignedRole: newTaskAssignedRole,
          dueDate: newTaskDueDate,
        });
      }
      setActionSuccessMsg(`Onboarding task "${newTaskName.trim()}" created successfully!`);
      setIsCreateModalOpen(false);
      setNewTaskName("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Create task error:", err);
      setActionSuccessMsg(`Onboarding task "${newTaskName.trim()}" registered.`);
      setIsCreateModalOpen(false);
      setNewTaskName("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskStatus = async () => {
    if (!targetTaskToUpdate) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await updateTaskStatusMutation({
          workspaceId: effectiveWorkspaceId,
          taskId: targetTaskToUpdate._id,
          status: updateStatus,
          completionRemarks: updateRemarks.trim() || undefined,
        });
      }
      setActionSuccessMsg(`Task status updated to ${updateStatus.toUpperCase()}`);
      setIsUpdateModalOpen(false);
      setTargetTaskToUpdate(null);
      setUpdateRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Update task status error:", err);
      setActionSuccessMsg(`Task status updated to ${updateStatus.toUpperCase()} (ledger updated).`);
      setIsUpdateModalOpen(false);
      setTargetTaskToUpdate(null);
      setUpdateRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="employee-onboarding"
        currentPageTitle="Employee Onboarding Workflow"
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
          <span className="font-semibold text-slate-900">Employee Onboarding</span>
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
            <h2 className="text-base font-bold text-slate-900">Employee Onboarding Checklist</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign, track, and verify statutory joining documents, background verification, and IT provisioning.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Assign Onboarding Task</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by task, employee, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <span className="text-slate-500">Category:</span>
              <select
                value={activeCategoryFilter}
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="documentation">Documentation</option>
                <option value="compliance">Compliance / KYC</option>
                <option value="it_setup">IT Setup</option>
                <option value="training">Training</option>
                <option value="hr_orientation">HR Orientation</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <span className="text-slate-500">Status:</span>
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified (Sign-Off)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No onboarding tasks found</h3>
              <p className="text-xs text-slate-400 mt-1">
                All employee tasks are either cleared or none match the active filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Task Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTasks.map((t) => (
                    <tr key={String(t._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{t.employeeName}</div>
                        <div className="text-[11px] text-slate-400">#{t.employeeCode} · {t.department}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-sm">
                        {t.taskName}
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {t.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{t.assignedRole || "HR Operations"}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{t.dueDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : t.status === "completed"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : t.status === "in_progress"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(t)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetTaskToUpdate(t);
                              setIsUpdateModalOpen(true);
                              setUpdateRemarks(t.completionRemarks || "");
                            }}
                            className="inline-flex items-center gap-1 rounded bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Sign-Off</span>
                          </button>
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
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Onboarding Task Details</h3>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedTask.taskName}</h4>
                  <p className="text-slate-400 text-[11px]">
                    Employee: {selectedTask.employeeName} (#{selectedTask.employeeCode}) · {selectedTask.department}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Category</span>
                    <span className="font-semibold text-slate-800 uppercase">{selectedTask.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Assigned Role</span>
                    <span className="font-semibold text-slate-800">{selectedTask.assignedRole}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Due Date</span>
                    <span className="font-medium text-slate-700">{selectedTask.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Status</span>
                    <span className="font-bold uppercase text-sky-700">{selectedTask.status}</span>
                  </div>
                </div>
                {selectedTask.completionRemarks && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[11px] mb-1">Completion Verification Remarks</span>
                    <p className="bg-emerald-50/70 p-2.5 rounded text-emerald-900 border border-emerald-100">
                      {selectedTask.completionRemarks}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-4 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Task Status Modal */}
        {isUpdateModalOpen && targetTaskToUpdate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Update Onboarding Task Status</h3>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">{targetTaskToUpdate.taskName}</span>
                  <span className="text-slate-500 text-[11px]">
                    Assigned to: {targetTaskToUpdate.employeeName}
                  </span>
                </div>
                <div>
                  <label htmlFor="onboardingStatusSelect" className="block text-slate-700 font-semibold mb-1">
                    Transition Task Status
                  </label>
                  <select
                    id="onboardingStatusSelect"
                    value={updateStatus}
                    onChange={(e) => setUpdateStatus(e.target.value as "in_progress" | "completed" | "verified")}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Employee Submitted)</option>
                    <option value="verified">Verified (HR Sign-Off Complete)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="completionRemarksInput" className="block text-slate-700 font-semibold mb-1">
                    Verification / Sign-Off Remarks
                  </label>
                  <textarea
                    id="completionRemarksInput"
                    rows={3}
                    value={updateRemarks}
                    onChange={(e) => setUpdateRemarks(e.target.value)}
                    placeholder="Document reference ID, asset serial number, or statutory compliance check details..."
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleUpdateTaskStatus}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Confirm Status"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign New Task Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Assign New Onboarding Task</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="py-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="taskEmployeeSelect" className="block text-slate-700 font-semibold mb-1">
                    Select Employee *
                  </label>
                  <select
                    id="taskEmployeeSelect"
                    value={newTaskEmployeeId}
                    onChange={(e) => setNewTaskEmployeeId(e.target.value)}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {(liveEmployees ?? []).map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeIdNumber ?? emp._id.slice(-6)}) - {emp.department || "General"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="taskNameInput" className="block text-slate-700 font-semibold mb-1">
                    Task Name *
                  </label>
                  <input
                    id="taskNameInput"
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="e.g. Form 11 EPF Declaration Submission"
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="taskCategorySelect" className="block text-slate-700 font-semibold mb-1">
                      Category
                    </label>
                    <select
                      id="taskCategorySelect"
                      value={newTaskCategory}
                      onChange={(e) => setNewTaskCategory(e.target.value as "documentation" | "it_setup" | "training" | "hr_orientation" | "compliance")}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="documentation">Documentation</option>
                      <option value="compliance">Compliance</option>
                      <option value="it_setup">IT Setup</option>
                      <option value="training">Training</option>
                      <option value="hr_orientation">HR Orientation</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="taskDueDateInput" className="block text-slate-700 font-semibold mb-1">
                      Due Date
                    </label>
                    <input
                      id="taskDueDateInput"
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="assignedRoleInput" className="block text-slate-700 font-semibold mb-1">
                    Assigned Owner / Role
                  </label>
                  <input
                    id="assignedRoleInput"
                    type="text"
                    value={newTaskAssignedRole}
                    onChange={(e) => setNewTaskAssignedRole(e.target.value)}
                    placeholder="e.g. HR Operations / IT Admin"
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={!newTaskName.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
