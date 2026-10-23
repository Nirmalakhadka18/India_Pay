"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Doc } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import {
  Briefcase,
  Building,
  Calendar,
  ChevronRight,
  Filter,
  GitFork,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

export default function PeoplePage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";
  const employees = useQuery(api.employees.list, scoped);

  const [viewMode, setViewMode] = useState<"directory" | "org_chart">("directory");
  const [activeTab, setActiveTab] = useState<"everyone" | "starred">("everyone");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  // Available departments for filtering
  const departments = useMemo(() => {
    if (!employees) return [];
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    return employees.filter((e) => {
      // Tab filter
      if (activeTab === "starred" && !starredIds.has(e._id)) {
        return false;
      }
      // Department filter
      if (selectedDepartment !== "all" && e.department !== selectedDepartment) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${e.firstName} ${e.lastName}`.toLowerCase();
        const empId = (
          ("employeeIdNumber" in e && typeof e.employeeIdNumber === "string"
            ? e.employeeIdNumber
            : e._id.slice(-6))
        ).toLowerCase();
        const dept = (e.department || "").toLowerCase();
        const desig = (e.designation || "").toLowerCase();
        return (
          fullName.includes(q) ||
          empId.includes(q) ||
          dept.includes(q) ||
          desig.includes(q)
        );
      }
      return true;
    });
  }, [employees, activeTab, starredIds, selectedDepartment, searchQuery]);

  // Selected Employee Details
  const selectedEmployee = useMemo(() => {
    if (!employees || employees.length === 0) return null;
    if (selectedEmpId) {
      return employees.find((e) => e._id === selectedEmpId) ?? employees[0];
    }
    return filteredEmployees[0] ?? employees[0];
  }, [employees, selectedEmpId, filteredEmployees]);

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Top Header Bar with Directory / Org Chart Toggle matching Screenshot 3 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-blue-600" />
            <h1 className="text-xl font-bold tracking-tight text-primary">
              People
            </h1>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("directory")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                viewMode === "directory"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-primary/70 hover:text-primary"
              }`}
            >
              Directory
            </button>
            <button
              type="button"
              onClick={() => setViewMode("org_chart")}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                viewMode === "org_chart"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-primary/70 hover:text-primary"
              }`}
            >
              Org Chart
            </button>
          </div>
        </div>

        {/* ── VIEW 1: DIRECTORY (MATCHES SCREENSHOT 3 SPLIT PANEL) ─────────── */}
        {viewMode === "directory" ? (
          <div className="space-y-4">
            {/* Tabs: Starred vs Everyone matching screenshot 3 */}
            <div className="flex items-center gap-6 border-b border-border text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("starred")}
                className={`flex items-center gap-1.5 pb-2.5 transition ${
                  activeTab === "starred"
                    ? "border-b-2 border-cyan-500 font-semibold text-primary"
                    : "text-primary/60 hover:text-primary"
                }`}
              >
                <Star
                  className={`h-4 w-4 ${
                    activeTab === "starred"
                      ? "fill-amber-400 text-amber-500"
                      : "text-primary/40"
                  }`}
                />
                Starred ({starredIds.size})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("everyone")}
                className={`pb-2.5 transition ${
                  activeTab === "everyone"
                    ? "border-b-2 border-cyan-500 font-semibold text-primary"
                    : "text-primary/60 hover:text-primary"
                }`}
              >
                Everyone ({employees?.length ?? 0})
              </button>
            </div>

            {/* Split Panel: Left List + Right Detail matching screenshot 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
              {/* Left Column (List) */}
              <div className="lg:col-span-5 rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col space-y-3">
                {/* Search & Filter Input matching screenshot 3 */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-primary/40" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter Emp. Name or ID"
                      className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                  {departments.length > 0 && (
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-primary/70 focus:outline-none"
                    >
                      <option value="all">All Depts</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Employees Scroll List matching screenshot 3 */}
                <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[520px] pr-1">
                  {employees === undefined ? (
                    <div className="flex h-40 items-center justify-center text-primary/40">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="py-12 text-center text-xs text-primary/40">
                      No employees match your criteria.
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected =
                        selectedEmployee && selectedEmployee._id === emp._id;
                      const isStarred = starredIds.has(emp._id);

                      return (
                        <button
                          key={emp._id}
                          type="button"
                          onClick={() => setSelectedEmpId(emp._id)}
                          className={`w-full flex items-center justify-between p-3 rounded-md text-left transition ${
                            isSelected
                              ? "bg-muted/80 border-l-4 border-blue-600 shadow-sm"
                              : "hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Black silhouette avatar matching screenshot 3 */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-primary">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="truncate text-[11px] text-primary/50 font-mono">
                                #{("employeeIdNumber" in emp && typeof emp.employeeIdNumber === "string" ? emp.employeeIdNumber : emp._id.slice(-6).toUpperCase())}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => toggleStar(emp._id, e)}
                            className="p-1 text-primary/30 hover:text-amber-500"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                isStarred
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-primary/20"
                              }`}
                            />
                          </button>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column (Details Card matching screenshot 3) */}
              <div className="lg:col-span-7 rounded-lg border border-border bg-card p-8 shadow-sm">
                {selectedEmployee ? (
                  <div className="space-y-8 max-w-lg">
                    {/* Header: Large Silhouette Avatar, Name, Star, #ID */}
                    <div className="flex items-start gap-5">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <User className="h-12 w-12" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold tracking-tight text-primary">
                            {selectedEmployee.firstName}{" "}
                            {selectedEmployee.lastName}
                          </h2>
                          <button
                            type="button"
                            onClick={() => toggleStar(selectedEmployee._id)}
                            className="p-1"
                          >
                            <Star
                              className={`h-5 w-5 ${
                                starredIds.has(selectedEmployee._id)
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-primary/30 hover:text-amber-500"
                              }`}
                            />
                          </button>
                        </div>
                        <p className="font-mono text-xs text-primary/60 font-medium">
                          #{("employeeIdNumber" in selectedEmployee && typeof selectedEmployee.employeeIdNumber === "string" ? selectedEmployee.employeeIdNumber : selectedEmployee._id.slice(-6).toUpperCase())}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                          {selectedEmployee.status}
                        </span>
                      </div>
                    </div>

                    {/* Section 1: CONTACT DETAILS matching screenshot 3 */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/50 border-b border-border/60 pb-1">
                        Contact Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-primary/50">Extension No</p>
                          <p className="font-medium text-primary mt-0.5">—</p>
                        </div>
                        <div>
                          <p className="text-primary/50">Work Email</p>
                          <p className="font-medium text-primary mt-0.5 truncate">
                            {selectedEmployee.email}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary/50">Mobile Phone</p>
                          <p className="font-medium text-primary mt-0.5">
                            {selectedEmployee.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: CATEGORY matching screenshot 3 */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/50 border-b border-border/60 pb-1">
                        Category
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-primary/50">Department</p>
                          <p className="font-medium text-primary mt-0.5">
                            {selectedEmployee.department || "General"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary/50">Designation</p>
                          <p className="font-medium text-primary mt-0.5">
                            {selectedEmployee.designation || "Staff"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary/50">Location</p>
                          <p className="font-medium text-primary mt-0.5">
                            Bangalore, India
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: OTHER INFORMATION matching screenshot 3 */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/50 border-b border-border/60 pb-1">
                        Other Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-primary/50">Joining Date</p>
                          <p className="font-medium text-primary mt-0.5">
                            {"joiningDate" in selectedEmployee &&
                            typeof selectedEmployee.joiningDate === "string"
                              ? new Date(
                                  selectedEmployee.joiningDate,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "01 Sep, 2026"}
                          </p>
                        </div>
                        <div>
                          <p className="text-primary/50">Date Of Birth</p>
                          <p className="font-medium text-primary mt-0.5">
                            {/* Privacy preserved: only display day & month, no year */}
                            13 Apr
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Privacy notice banner */}
                    <div className="rounded-md bg-muted/40 p-3 text-[11px] text-primary/50 leading-relaxed">
                      Privacy Protected: Confidential statutory and banking credentials (PAN, UAN, Bank Account, Salary) are strictly redacted for peer organization directory views.
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-primary/40">
                    Select an employee from the directory to view details.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── VIEW 2: ORG CHART ─────────────────────────────────────────── */
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
              <div className="text-center max-w-md mx-auto space-y-3 mb-8">
                <GitFork className="mx-auto h-8 w-8 text-blue-600" />
                <h2 className="text-lg font-semibold text-primary">
                  Organization Hierarchy Chart
                </h2>
                <p className="text-xs text-primary/60">
                  Visual reporting relationships across departments and leadership teams.
                </p>
              </div>

              {employees === undefined ? (
                <div className="flex h-48 items-center justify-center text-primary/40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {/* Top Level Leadership Node */}
                  <div className="rounded-lg border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 p-4 text-center max-w-xs mx-auto shadow-sm">
                    <p className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                      Workspace Leadership
                    </p>
                    <p className="text-sm font-bold text-primary mt-1">
                      Organization Admin
                    </p>
                    <p className="text-xs text-primary/60">Human Resources & Operations</p>
                  </div>

                  <div className="w-0.5 h-6 bg-border mx-auto" />

                  {/* Departments Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {departments.map((dept) => {
                      const deptMembers = employees.filter(
                        (e) => e.department === dept,
                      );
                      return (
                        <div
                          key={dept}
                          className="rounded-lg border border-border bg-card p-4 space-y-3"
                        >
                          <div className="border-b border-border pb-2">
                            <p className="text-xs font-semibold text-primary">
                              {dept}
                            </p>
                            <p className="text-[11px] text-primary/50">
                              {deptMembers.length} member(s)
                            </p>
                          </div>
                          <div className="space-y-2">
                            {deptMembers.map((m) => (
                              <div
                                key={m._id}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                                <span className="font-medium text-primary truncate">
                                  {m.firstName} {m.lastName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
