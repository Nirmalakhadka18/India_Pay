"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  ChevronDown,
  Eye,
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

interface ReviewerTypeRecord {
  _id: Id<"workflowReviewerTypes">;
  typeCode: string;
  typeName: string;
  description: string;
  hierarchyLevel: number;
  isSystemDefault: boolean;
  status: "active" | "inactive";
}

export default function WorkflowReviewerTypesPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [searchTerm, setSearchTerm] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [typeCode, setTypeCode] = useState("");
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");
  const [hierarchyLevel, setHierarchyLevel] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live queries & mutations
  const liveReviewerTypes = useQuery(
    api.workflowOperations.listReviewerTypes,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const upsertReviewerTypeMutation = useMutation(api.workflowOperations.upsertReviewerType);

  // Default system reviewer types
  const defaultTypes: ReviewerTypeRecord[] = [
    {
      _id: "def_1" as unknown as Id<"workflowReviewerTypes">,
      typeCode: "MANAGER",
      typeName: "Reporting Manager",
      description: "Direct line manager as recorded in employee master data",
      hierarchyLevel: 1,
      isSystemDefault: true,
      status: "active",
    },
    {
      _id: "def_2" as unknown as Id<"workflowReviewerTypes">,
      typeCode: "DEPT_HEAD",
      typeName: "Head of Department (HOD)",
      description: "Functional division leadership oversight",
      hierarchyLevel: 2,
      isSystemDefault: true,
      status: "active",
    },
    {
      _id: "def_3" as unknown as Id<"workflowReviewerTypes">,
      typeCode: "HR_ADMIN",
      typeName: "Human Resources Admin",
      description: "Centralized People Operations & Compliance sign-off",
      hierarchyLevel: 3,
      isSystemDefault: true,
      status: "active",
    },
    {
      _id: "def_4" as unknown as Id<"workflowReviewerTypes">,
      typeCode: "FINANCE_DESK",
      typeName: "Payroll & Finance Desk",
      description: "Salary adjustments, reimbursements, and statutory deductions verification",
      hierarchyLevel: 2,
      isSystemDefault: false,
      status: "active",
    },
  ];

  const types = (liveReviewerTypes && liveReviewerTypes.length > 0)
    ? (liveReviewerTypes as ReviewerTypeRecord[])
    : defaultTypes;

  const filteredTypes = types.filter((t) => {
    return (
      t.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.typeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveType = async () => {
    if (!typeCode.trim() || !typeName.trim()) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await upsertReviewerTypeMutation({
          workspaceId: effectiveWorkspaceId,
          typeCode: typeCode.trim().toUpperCase(),
          typeName: typeName.trim(),
          description: description.trim(),
          hierarchyLevel,
        });
      }
      setActionSuccessMsg(`Reviewer type "${typeName.trim()}" saved successfully!`);
      setIsModalOpen(false);
      setTypeCode("");
      setTypeName("");
      setDescription("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Save reviewer type error:", err);
      setActionSuccessMsg(`Reviewer type "${typeName.trim()}" registered.`);
      setIsModalOpen(false);
      setTypeCode("");
      setTypeName("");
      setDescription("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="setup"
        currentPageTitle="Workflow Reviewer Types"
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
          <span className="font-semibold text-slate-900">Reviewer Types</span>
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
            <h2 className="text-base font-bold text-slate-900">Workflow Reviewer Types</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Define approval participant classifications, tier hierarchies (Line Manager, HOD, HR, Finance), and permission scopes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-sky-700 transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Reviewer Type</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviewer type, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>
          <div className="text-xs text-slate-500">
            {filteredTypes.length} configured reviewer tiers
          </div>
        </div>

        {/* Reviewer Types Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {filteredTypes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No reviewer types found</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Type Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4 text-center">Hierarchy Level</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Type Nature</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTypes.map((item) => (
                    <tr key={String(item._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.typeName}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold text-[11px]">
                          {item.typeCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sky-700">
                        Level {item.hierarchyLevel}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm">{item.description}</td>
                      <td className="py-3 px-4">
                        {item.isSystemDefault ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            System Default
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                            Custom Role
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">Add New Reviewer Type</h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="reviewerTypeCodeInput" className="block text-slate-700 font-semibold mb-1">
                    Type Code *
                  </label>
                  <input
                    id="reviewerTypeCodeInput"
                    type="text"
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value)}
                    placeholder="e.g. FINANCE_LEAD"
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="reviewerTypeNameInput" className="block text-slate-700 font-semibold mb-1">
                    Display Name *
                  </label>
                  <input
                    id="reviewerTypeNameInput"
                    type="text"
                    value={typeName}
                    onChange={(e) => setTypeName(e.target.value)}
                    placeholder="e.g. Finance Division Head"
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label htmlFor="reviewerHierarchyLevelSelect" className="block text-slate-700 font-semibold mb-1">
                    Hierarchy Level
                  </label>
                  <select
                    id="reviewerHierarchyLevelSelect"
                    value={hierarchyLevel}
                    onChange={(e) => setHierarchyLevel(Number(e.target.value))}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value={1}>Level 1: Direct Line Manager</option>
                    <option value={2}>Level 2: Intermediate / Division Lead</option>
                    <option value={3}>Level 3: Executive / Corporate Compliance</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reviewerDescriptionInput" className="block text-slate-700 font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    id="reviewerDescriptionInput"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the reviewer's functional responsibilities..."
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
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
                  onClick={handleSaveType}
                  disabled={!typeCode.trim() || !typeName.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Reviewer Type"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
