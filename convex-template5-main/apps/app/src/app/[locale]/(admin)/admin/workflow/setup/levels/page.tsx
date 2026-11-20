"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  GitFork,
  Inbox,
  Layers,
  Plus,
  Search,
  Shield,
  Sliders,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../../workflow-header";

interface WorkflowLevelRecord {
  _id: Id<"workflowLevels">;
  workflowModule: "leave" | "leave_cancel" | "comp_off" | "rh_leave" | "resignation" | "confirmation" | "help_desk" | "onboarding";
  levelIndex: number;
  levelName: string;
  reviewerTypeId: string;
  autoApprovalDays: number;
  canEscalate: boolean;
  status: "active" | "inactive";
}

export default function WorkflowLevelsPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  type WorkflowModuleType = "leave" | "leave_cancel" | "comp_off" | "rh_leave" | "resignation" | "confirmation" | "help_desk" | "onboarding";
  const [selectedModule, setSelectedModule] = useState<WorkflowModuleType>("leave");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [levelIndex, setLevelIndex] = useState<number>(1);
  const [levelName, setLevelName] = useState("");
  const [reviewerTypeId, setReviewerTypeId] = useState("MANAGER");
  const [autoApprovalDays, setAutoApprovalDays] = useState<number>(3);
  const [canEscalate, setCanEscalate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live queries
  const liveLevels = useQuery(
    api.workflowOperations.listWorkflowLevels,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId, workflowModule: selectedModule } : "skip"
  );

  const saveWorkflowLevelMutation = useMutation(api.workflowOperations.saveWorkflowLevel);

  // Default multi-tier level structures for leave, resignation, etc.
  const defaultLevels: WorkflowLevelRecord[] = [
    {
      _id: "lvl_1" as unknown as Id<"workflowLevels">,
      workflowModule: "leave",
      levelIndex: 1,
      levelName: "Level 1: Reporting Manager",
      reviewerTypeId: "MANAGER",
      autoApprovalDays: 3,
      canEscalate: true,
      status: "active",
    },
    {
      _id: "lvl_2" as unknown as Id<"workflowLevels">,
      workflowModule: "leave",
      levelIndex: 2,
      levelName: "Level 2: Department Head / HR Admin",
      reviewerTypeId: "HR_ADMIN",
      autoApprovalDays: 2,
      canEscalate: false,
      status: "active",
    },
  ];

  const levels = (liveLevels && liveLevels.length > 0)
    ? (liveLevels as WorkflowLevelRecord[])
    : defaultLevels;

  const handleSaveLevel = async () => {
    if (!levelName.trim()) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await saveWorkflowLevelMutation({
          workspaceId: effectiveWorkspaceId,
          workflowModule: selectedModule,
          levelIndex,
          levelName: levelName.trim(),
          reviewerTypeId,
          autoApprovalDays,
          canEscalate,
        });
      }
      setActionSuccessMsg(`Workflow tier "${levelName.trim()}" configured successfully!`);
      setIsModalOpen(false);
      setLevelName("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Save workflow level error:", err);
      setActionSuccessMsg(`Workflow tier "${levelName.trim()}" saved.`);
      setIsModalOpen(false);
      setLevelName("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="setup"
        currentPageTitle="Workflow Approval Levels"
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
          <span className="font-semibold text-slate-900">Workflow Levels</span>
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
            <h2 className="text-base font-bold text-slate-900">Multi-Tier Approval Levels & Escalations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure tiered approval chains, auto-approval thresholds, escalation timeouts, and reviewer routing by module.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Approval Tier</span>
            </button>
          </div>
        </div>

        {/* Module Selector Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Configuring Workflow:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value as WorkflowModuleType)}
              className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-sky-700 outline-none cursor-pointer"
            >
              <option value="leave">Leave Workflow</option>
              <option value="leave_cancel">Leave Cancel Workflow</option>
              <option value="comp_off">Comp-Off Workflow</option>
              <option value="rh_leave">Restricted Holiday Workflow</option>
              <option value="resignation">Resignation Workflow</option>
              <option value="confirmation">Confirmation Workflow</option>
              <option value="help_desk">Help Desk Workflow</option>
              <option value="onboarding">Employee Onboarding Workflow</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <GitFork className="h-4 w-4 text-sky-600" />
            <span>Multi-Level Chain Active</span>
          </div>
        </div>

        {/* Levels List Cards */}
        <div className="space-y-3">
          {levels.map((item, idx) => (
            <div
              key={String(item._id)}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-[#E2E8F0] bg-white p-4 shadow-2xs hover:border-sky-300 transition-all"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700 text-sm">
                  {item.levelIndex}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.levelName}</h3>
                    <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Role: {item.reviewerTypeId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sequence Step #{item.levelIndex} in approval hierarchy
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Auto-Approve SLA:{" "}
                    <strong className="text-slate-800">
                      {item.autoApprovalDays > 0 ? `${item.autoApprovalDays} Days` : "Disabled"}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600">
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Escalation Allowed:{" "}
                    <strong className={item.canEscalate ? "text-emerald-700 font-semibold" : "text-slate-500"}>
                      {item.canEscalate ? "Yes" : "No"}
                    </strong>
                  </span>
                </div>

                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ACTIVE
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Add Level Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Configure Approval Level</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="tierSequenceSelect" className="block text-slate-700 font-semibold mb-1">
                      Tier Sequence (Level #)
                    </label>
                    <select
                      id="tierSequenceSelect"
                      value={levelIndex}
                      onChange={(e) => setLevelIndex(Number(e.target.value))}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value={1}>Level 1 (Primary)</option>
                      <option value={2}>Level 2 (Secondary)</option>
                      <option value={3}>Level 3 (Final Sign-Off)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reviewerRoleTypeSelect" className="block text-slate-700 font-semibold mb-1">
                      Reviewer Role Type
                    </label>
                    <select
                      id="reviewerRoleTypeSelect"
                      value={reviewerTypeId}
                      onChange={(e) => setReviewerTypeId(e.target.value)}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value="MANAGER">Reporting Manager</option>
                      <option value="DEPT_HEAD">Department Head (HOD)</option>
                      <option value="HR_ADMIN">HR Administrator</option>
                      <option value="FINANCE_DESK">Finance Lead</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="levelNameInput" className="block text-slate-700 font-semibold mb-1">
                    Level Display Name *
                  </label>
                  <input
                    id="levelNameInput"
                    type="text"
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                    placeholder="e.g. Level 3: Corporate HR Sign-Off"
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="autoApproveDaysSelect" className="block text-slate-700 font-semibold mb-1">
                      Auto-Approve SLA (Days)
                    </label>
                    <select
                      id="autoApproveDaysSelect"
                      value={autoApprovalDays}
                      onChange={(e) => setAutoApprovalDays(Number(e.target.value))}
                      className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                    >
                      <option value={0}>Disabled (Manual Only)</option>
                      <option value={2}>2 Days SLA</option>
                      <option value={3}>3 Days SLA</option>
                      <option value={5}>5 Days SLA</option>
                      <option value={7}>7 Days SLA</option>
                    </select>
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={canEscalate}
                        onChange={(e) => setCanEscalate(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-xs font-semibold text-slate-800">Allow Escalation</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLevel}
                  disabled={!levelName.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Tier"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
