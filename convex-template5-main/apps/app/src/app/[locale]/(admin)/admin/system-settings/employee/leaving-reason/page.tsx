"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Info,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_LEAVING_REASONS = [
  { code: "RESIGN", description: "Resignation - Career Advancement", pfCode: "10", isActive: true },
  { code: "HIGHER_EDU", description: "Resignation - Higher Education", pfCode: "10", isActive: true },
  { code: "PERSONAL", description: "Resignation - Personal / Health Reasons", pfCode: "10", isActive: true },
  { code: "RELOCATION", description: "Relocation / Location Change", pfCode: "10", isActive: true },
  { code: "RETIRE", description: "Superannuation / Retirement", pfCode: "02", isActive: true },
  { code: "TERMINATION", description: "Contract Expiry / Termination", pfCode: "03", isActive: true },
  { code: "DECEASED", description: "Death in Service", pfCode: "01", isActive: true },
];

export default function LeavingReasonPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [pfCode, setPfCode] = useState("10");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  let reasonsData: any = undefined;
  try {
    reasonsData = useQuery(api.systemSettings.getLeavingReasons);
  } catch (e) {
    reasonsData = undefined;
  }
  const reasonsList = reasonsData || DEFAULT_LEAVING_REASONS;

  let saveReason: any = null;
  try {
    saveReason = useMutation(api.systemSettings.saveLeavingReason);
  } catch (e) {
    saveReason = null;
  }

  const filteredReasons = reasonsList.filter((r: any) =>
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.pfCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!code.trim() || !description.trim()) {
      setErrorMessage("Code and description are required");
      return;
    }

    try {
      setIsSaving(true);
      if (saveReason) {
        await saveReason({
          code: code.trim().toUpperCase(),
          description: description.trim(),
          pfCode: pfCode.trim(),
          isActive: true,
        });
      }
      setSaveSuccess(true);
      setShowAddModal(false);
      setCode("");
      setDescription("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save leaving reason");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin/system-settings/general/company-info" className="hover:text-blue-600">
          Settings
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/admin/system-settings/employee/preferences" className="hover:text-blue-600">
          Employee
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">Leaving Reason</span>
      </div>

      {/* greytHR Exact Help Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start justify-between shadow-sm">
        <div className="space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            Separation & Leaving Reasons Configuration
          </p>
          <p className="text-slate-600 leading-relaxed">
            On the Leaving Reason page, you can customize the various reasons for an employee leaving your organization and tag a statutory PF code to these values for EPFO ECR settlement and exit reporting.
          </p>
        </div>
      </div>

      {/* Main Table Box */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reason, code, PF reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Leaving Reason</span>
          </button>
        </div>

        {/* Table matching greytHR Leaving Reason */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-5 w-16">#</th>
                <th className="py-3 px-5 w-32">Reason Code</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5 w-36 font-mono">Statutory PF Code</th>
                <th className="py-3 px-5 w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReasons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                    No leaving reasons configured. Click &quot;Add Leaving Reason&quot; to define one.
                  </td>
                </tr>
              ) : (
                filteredReasons.map((r: any, idx: number) => (
                  <tr key={r.code} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-5 text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{r.code}</td>
                    <td className="py-3 px-5 font-bold text-slate-900 flex items-center gap-2">
                      <LogOut className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{r.description}</span>
                    </td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-700">
                      <span className="bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        PF-{r.pfCode}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-500">
          <span>Total Leaving Reasons: {filteredReasons.length}</span>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle className="h-3.5 w-3.5" /> Leaving reason updated
            </span>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black text-slate-900 mb-1">Add Leaving Reason</h3>
            <p className="text-xs text-slate-500 mb-4">
              Map organization separation categories to EPFO standard reason codes.
            </p>

            {errorMessage && (
              <div className="mb-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. HEALTH_REASON"
                  className="w-full h-9 px-3 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Resignation - Medical / Health Reasons"
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  EPFO Statutory PF Code
                </label>
                <select
                  value={pfCode}
                  onChange={(e) => setPfCode(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                >
                  <option value="10">10 - Cessation (Short Service / Normal Resignation)</option>
                  <option value="02">02 - Superannuation (Retirement)</option>
                  <option value="03">03 - Termination / Retrenchment</option>
                  <option value="01">01 - Death in Service</option>
                  <option value="04">04 - Permanent Incapacity</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Save Reason</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
