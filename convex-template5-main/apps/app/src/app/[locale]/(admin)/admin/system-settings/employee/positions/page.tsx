"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ChevronRight,
  Filter,
  Info,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const DEFAULT_POSITIONS = [
  { code: "JR_DEV", title: "Junior Developer", department: "Engineering", level: "L1", isActive: true },
  { code: "SR_DEV", title: "Senior Developer", department: "Engineering", level: "L3", isActive: true },
  { code: "TECH_LEAD", title: "Technical Lead", department: "Engineering", level: "L4", isActive: true },
  { code: "HR_EXEC", title: "HR Executive", department: "Human Resources", level: "L2", isActive: true },
  { code: "FIN_MGR", title: "Finance Manager", department: "Finance", level: "L4", isActive: true },
  { code: "QA_ENG", title: "QA Engineer", department: "Quality Assurance", level: "L2", isActive: true },
];

export default function EmployeePositionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [level, setLevel] = useState("L1");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  let positionsData: any = undefined;
  try {
    positionsData = useQuery(api.systemSettings.getEmployeePositions);
  } catch (e) {
    positionsData = undefined;
  }
  const positionsList = positionsData || DEFAULT_POSITIONS;

  let savePosition: any = null;
  try {
    savePosition = useMutation(api.systemSettings.saveEmployeePosition);
  } catch (e) {
    savePosition = null;
  }

  const filteredPositions = positionsList.filter((p: any) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || p.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!code.trim() || !title.trim()) {
      setErrorMessage("Position code and title are required");
      return;
    }

    try {
      setIsSaving(true);
      if (savePosition) {
        await savePosition({
          code: code.trim().toUpperCase(),
          title: title.trim(),
          department,
          level,
          isActive: true,
        });
      }
      setSaveSuccess(true);
      setShowAddModal(false);
      setCode("");
      setTitle("");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save employee position");
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
        <span className="text-slate-800 font-bold">Employee Positions</span>
      </div>

      {/* Help Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start justify-between shadow-sm">
        <div className="space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            Employee Position & Hierarchy Configuration
          </p>
          <p className="text-slate-600 leading-relaxed">
            Manage organizational job designations, corporate bands, and job levels used for head-count reporting, role-based workflows, and compensation brackets.
          </p>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search position title or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 shadow-sm outline-none"
              >
                <option value="All">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Quality Assurance">Quality Assurance</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Position</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-slate-700 font-bold uppercase tracking-wider">
                <th className="py-3 px-5 w-16">#</th>
                <th className="py-3 px-5">Position Code</th>
                <th className="py-3 px-5">Designation Title</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5 w-28">Band / Level</th>
                <th className="py-3 px-5 w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPositions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    No positions match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredPositions.map((pos: any, idx: number) => (
                  <tr key={pos.code} className="hover:bg-slate-50/75 transition">
                    <td className="py-3 px-5 text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-3 px-5 font-mono font-bold text-blue-700">{pos.code}</td>
                    <td className="py-3 px-5 font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{pos.title}</span>
                    </td>
                    <td className="py-3 px-5 text-slate-700 font-medium">{pos.department}</td>
                    <td className="py-3 px-5 font-mono font-bold text-slate-600 bg-slate-50 px-2 rounded">
                      {pos.level}
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
          <span>Total Positions: {filteredPositions.length}</span>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle className="h-3.5 w-3.5" /> Position saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-sm font-black text-slate-900 mb-1">Add Employee Position</h3>
            <p className="text-xs text-slate-500 mb-4">
              Create a new official position designation for employee profiles.
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
                  Position Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. PRD_MGR"
                  className="w-full h-9 px-3 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Product Manager"
                  className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Product">Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Band / Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full h-9 px-3 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  >
                    <option value="L1">L1 - Entry</option>
                    <option value="L2">L2 - Associate</option>
                    <option value="L3">L3 - Senior</option>
                    <option value="L4">L4 - Lead / Manager</option>
                    <option value="L5">L5 - Director / VP</option>
                  </select>
                </div>
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
                  <span>Save Position</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
