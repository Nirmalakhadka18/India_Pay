"use client";

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminTopbar } from "../admin-topbar";

export interface WorkforceHeaderProps {
  currentCategory?: "overview" | "leave" | "admin-tools";
  currentPageTitle?: string;
}

export function WorkforceHeader({
  currentCategory = "overview",
  currentPageTitle = "Leave Overview",
}: WorkforceHeaderProps) {
  const [payrollMonth, setPayrollMonth] = useState("Nov'26");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [activeDropdown, setActiveDropdown] = useState<"leave" | "admin-tools" | null>(null);

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

  const leaveItems = [
    { label: "Leave Calendar", href: "/admin/leave/leave-calendar" },
    { label: "Employee Leave", href: "/admin/leave/employee-leave" },
    { label: "Leave Granter", href: "/admin/leave/leave-granter" },
    { label: "Year End Process", href: "/admin/leave/year-end-process" },
    { label: "Leave Recalculator", href: "/admin/leave/leave-recalculator" },
  ];

  const adminToolsItems = [
    { label: "Holiday List", href: "/admin/leave/holiday-list" },
    { label: "Weekend Override", href: "/admin/leave/weekend-override" },
    { label: "Employee Week Days", href: "/admin/leave/employee-week-days" },
    { label: "Leave Type Reviewer", href: "/admin/leave/leave-type-reviewer" },
  ];

  return (
    <div className="w-full bg-white border-b border-[#E2E8F0] shadow-xs sticky top-0 z-40">
      {/* Global Topbar */}
      <AdminTopbar />

      {/* Workforce Management Secondary Header */}
      <div className="flex h-12 items-center justify-between px-6 border-t border-slate-100 bg-white">
        <div className="flex items-center space-x-6">
          <Link
            href="/admin/leave/overview"
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
              currentCategory === "overview"
                ? "text-sky-700 bg-sky-50/80 px-2.5 py-1 rounded-md"
                : "text-slate-700 hover:text-sky-600"
            }`}
          >
            <span>Workforce Management</span>
          </Link>

          <div className="flex items-center space-x-3 text-xs" ref={menuRef}>
            {/* Leave Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(activeDropdown === "leave" ? null : "leave")
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  currentCategory === "leave" || activeDropdown === "leave"
                    ? "bg-slate-100 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>Leave</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {activeDropdown === "leave" && (
                <div className="absolute left-0 mt-1 w-52 rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg z-50">
                  {leaveItems.map((item) => (
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

            {/* Admin Tools Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActiveDropdown(
                    activeDropdown === "admin-tools" ? null : "admin-tools"
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                  currentCategory === "admin-tools" ||
                  activeDropdown === "admin-tools"
                    ? "bg-slate-100 text-sky-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>Admin Tools</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>

              {activeDropdown === "admin-tools" && (
                <div className="absolute left-0 mt-1 w-56 rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg z-50">
                  {adminToolsItems.map((item) => (
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
