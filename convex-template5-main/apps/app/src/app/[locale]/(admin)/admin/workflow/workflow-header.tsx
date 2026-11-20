"use client";

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Settings,
  Sliders,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminTopbar } from "../admin-topbar";

export interface WorkflowHeaderProps {
  currentModule?:
    | "leave"
    | "leave-comp-off"
    | "leave-cancel"
    | "help-desk"
    | "rh-leave"
    | "employee-onboarding"
    | "resignation"
    | "confirmation"
    | "setup";
  currentTab?: "review" | "monitor";
  currentPageTitle?: string;
}

export function WorkflowHeader({
  currentModule = "leave",
  currentTab = "review",
  currentPageTitle = "Leave Workflow",
}: WorkflowHeaderProps) {
  const [payrollMonth, setPayrollMonth] = useState("Nov'26");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [activeDropdown, setActiveDropdown] = useState<
    "modules" | "setup" | null
  >(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const modules = [
    { label: "Leave", href: "/admin/workflow/leave", id: "leave" },
    {
      label: "Leave Comp Off",
      href: "/admin/workflow/leave-comp-off",
      id: "leave-comp-off",
    },
    {
      label: "Leave Cancel",
      href: "/admin/workflow/leave-cancel",
      id: "leave-cancel",
    },
    {
      label: "Help Desk",
      href: "/admin/workflow/help-desk",
      id: "help-desk",
    },
    {
      label: "Restricted Holiday Leave",
      href: "/admin/workflow/rh-leave",
      id: "rh-leave",
    },
    {
      label: "Employee Onboarding",
      href: "/admin/workflow/employee-onboarding",
      id: "employee-onboarding",
    },
    {
      label: "Resignation",
      href: "/admin/workflow/resignation",
      id: "resignation",
    },
    {
      label: "Confirmation",
      href: "/admin/workflow/confirmation",
      id: "confirmation",
    },
  ];

  const setupItems = [
    {
      label: "Workflow Delegates",
      href: "/admin/workflow/setup/delegates",
    },
    {
      label: "Workflow Reviewers Types",
      href: "/admin/workflow/setup/reviewer-types",
    },
    {
      label: "Workflow Levels",
      href: "/admin/workflow/setup/levels",
    },
  ];

  const currentModuleName =
    modules.find((m) => m.id === currentModule)?.label || "Leave";

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-40">
      {/* Global Topbar */}
      <AdminTopbar />

      {/* Workflow Navigation Subbar */}
      <div className="flex h-12 items-center justify-between px-6 border-t border-slate-100 bg-white">
        <div className="flex items-center space-x-6">
          <Link
            href="/admin/workflow/leave"
            className="flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-sky-600 transition-colors"
          >
            <span>Workflow</span>
          </Link>

          <div className="flex items-center space-x-3 text-xs" ref={menuRef}>
            {/* Modules Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "modules" ? null : "modules"
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeDropdown === "modules"
                    ? "bg-slate-100 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>Modules</span>
                <span className="text-[11px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded ml-0.5">
                  {currentModuleName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {activeDropdown === "modules" && (
                <div className="absolute left-0 mt-1 w-56 rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg z-50">
                  {modules.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className={`block px-4 py-2 text-xs transition-colors ${
                        item.id === currentModule
                          ? "bg-sky-50 text-sky-700 font-semibold"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Setup Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "setup" ? null : "setup")
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  currentModule === "setup" || activeDropdown === "setup"
                    ? "bg-slate-100 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>Setup</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {activeDropdown === "setup" && (
                <div className="absolute left-0 mt-1 w-56 rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg z-50">
                  {setupItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setActiveDropdown(null)}
                      className="block px-4 py-2 text-xs font-normal text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Payroll Month:</span>
            <select
              value={payrollMonth}
              onChange={(e) => setPayrollMonth(e.target.value)}
              aria-label="Payroll Month"
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="Nov'26">Nov'26</option>
              <option value="Oct'26">Oct'26</option>
              <option value="Sep'26">Sep'26</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs">
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              aria-label="Employee Filter"
              className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Employees</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">Human Resources</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
