"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Edit2,
  FolderPlus,
  Info,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface AssetGroup {
  _id?: string;
  code: string;
  name: string;
  isReturnable: boolean;
  depreciationRate: number;
  requiresApproval: boolean;
  active: boolean;
}

const DEFAULT_ASSET_GROUPS: AssetGroup[] = [
  {
    code: "LAPTOP",
    name: "Laptops & Notebooks",
    isReturnable: true,
    depreciationRate: 25,
    requiresApproval: true,
    active: true,
  },
  {
    code: "MONITOR",
    name: "Computer Monitors",
    isReturnable: true,
    depreciationRate: 20,
    requiresApproval: true,
    active: true,
  },
  {
    code: "MOBILE",
    name: "Mobile Devices & Tablets",
    isReturnable: true,
    depreciationRate: 33,
    requiresApproval: true,
    active: true,
  },
  {
    code: "PERIPHERAL",
    name: "Keyboards, Mice & Headsets",
    isReturnable: false,
    depreciationRate: 50,
    requiresApproval: false,
    active: true,
  },
  {
    code: "ID_CARD",
    name: "Access Cards & Keys",
    isReturnable: true,
    depreciationRate: 0,
    requiresApproval: false,
    active: true,
  },
];

export default function AssetGroupSettingsPage() {
  const [assetGroups, setAssetGroups] = useState<AssetGroup[]>(DEFAULT_ASSET_GROUPS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AssetGroup | null>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formReturnable, setFormReturnable] = useState(true);
  const [formDepreciation, setFormDepreciation] = useState<number>(20);
  const [formApproval, setFormApproval] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  let remoteGroups: any = undefined;
  try {
    remoteGroups = useQuery((api as any)?.systemSettings?.getAssetGroupSettings);
  } catch (e) {
    remoteGroups = undefined;
  }

  useEffect(() => {
    if (remoteGroups && remoteGroups.length > 0) {
      setAssetGroups(remoteGroups);
    }
  }, [remoteGroups]);

  const filteredGroups = assetGroups.filter(
    (g) =>
      g.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setEditingItem(null);
    setFormCode("");
    setFormName("");
    setFormReturnable(true);
    setFormDepreciation(20);
    setFormApproval(true);
    setIsModalOpen(true);
  };

  const openEditModal = (group: AssetGroup) => {
    setEditingItem(group);
    setFormCode(group.code);
    setFormName(group.name);
    setFormReturnable(group.isReturnable);
    setFormDepreciation(group.depreciationRate);
    setFormApproval(group.requiresApproval);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formName.trim()) return;

    setIsSaving(true);
    try {
      if (editingItem) {
        setAssetGroups((prev) =>
          prev.map((g) =>
            g.code === editingItem.code
              ? {
                  ...g,
                  name: formName,
                  isReturnable: formReturnable,
                  depreciationRate: formDepreciation,
                  requiresApproval: formApproval,
                }
              : g
          )
        );
        setFeedback("Asset Group updated successfully!");
      } else {
        const newItem: AssetGroup = {
          code: formCode.toUpperCase().trim(),
          name: formName.trim(),
          isReturnable: formReturnable,
          depreciationRate: formDepreciation,
          requiresApproval: formApproval,
          active: true,
        };
        setAssetGroups((prev) => [...prev, newItem]);
        setFeedback("Asset Group created successfully!");
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete asset group ${code}?`)) {
      setAssetGroups((prev) => prev.filter((g) => g.code !== code));
      setFeedback("Asset Group deleted.");
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin/employee/main/overview" className="hover:text-blue-600 transition">
          Settings
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/admin/system-settings/employee" className="hover:text-blue-600 transition">
          Employee
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Asset Group Settings</span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col gap-1 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 p-4">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <h2 className="text-sm font-bold text-slate-900">Asset Group Settings</h2>
        </div>
        <p className="text-xs text-slate-600 pl-6 leading-relaxed">
          Manage hardware, equipment, and access card categories distributed to employees. Configure returnable flags, depreciation policies, and approval rules.
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search asset group code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Asset Group</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 animate-in fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Group Code</th>
              <th className="px-5 py-3">Group Name</th>
              <th className="px-5 py-3 text-center">Returnable</th>
              <th className="px-5 py-3 text-center">Depreciation %</th>
              <th className="px-5 py-3 text-center">Approval Req.</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  No asset groups found matching your search.
                </td>
              </tr>
            ) : (
              filteredGroups.map((group) => (
                <tr key={group.code} className="hover:bg-slate-50/50 transition">
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                      {group.code}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">
                    {group.name}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        group.isReturnable
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {group.isReturnable ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium text-slate-700">
                    {group.depreciationRate}% / yr
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        group.requiresApproval
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {group.requiresApproval ? "Manager" : "None"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(group)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(group.code)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">
                {editingItem ? "Edit Asset Group" : "Add Asset Group"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Code *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingItem}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WORKSTATION"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Workstations and Desktops"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Depreciation Rate (% per annum)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formDepreciation}
                  onChange={(e) => setFormDepreciation(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formReturnable}
                    onChange={(e) => setFormReturnable(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Asset is Returnable upon Employee Separation</span>
                </label>

                <label className="flex items-center gap-3 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formApproval}
                    onChange={(e) => setFormApproval(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Require Line Manager Approval for Allocation</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                >
                  {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingItem ? "Update Group" : "Create Group"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
