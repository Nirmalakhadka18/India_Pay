"use client";

import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminTopbar } from "../admin-topbar";

export interface PayrollHeaderProps {
  currentTab?: string; // "overview" | "info" | "inputs" | "process" | "verify" | "payout" | "publishedinfo" | "admin" | "setup"
  currentSubTitle?: string;
}

export function PayrollHeader({
  currentTab = "overview",
  currentSubTitle,
}: PayrollHeaderProps) {
  const [payrollMonth, setPayrollMonth] = useState("Nov'26");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHoveredTab(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Exact 8 Categories extracted directly from greytHR shadow DOM via REA
  const navCategories: Record<
    string,
    { label: string; items: { title: string; href: string }[] }
  > = {
    info: {
      label: "Information",
      items: [
        {
          title: "Salary Revision History",
          href: "/admin/payroll/information",
        },
        {
          title: "Salary Revision Analytics",
          href: "/admin/payroll/information",
        },
      ],
    },
    inputs: {
      label: "Payroll Inputs",
      items: [
        { title: "Salary", href: "/admin/payroll/inputs" },
        { title: "Loan", href: "/admin/payroll/loans" },
        { title: "Salary Revisions", href: "/admin/payroll/inputs" },
        { title: "Income Tax", href: "/admin/payroll/inputs" },
        { title: "Reimbursement", href: "/admin/payroll/reimbursements" },
        { title: "Employee LOP Days", href: "/admin/payroll/inputs" },
        { title: "Stop Salary Processing", href: "/admin/payroll/inputs" },
        { title: "Arrears", href: "/admin/payroll/inputs" },
        { title: "Release Salary", href: "/admin/payroll/inputs" },
        { title: "Final Settlement", href: "/admin/payroll/inputs" },
        { title: "Resettlement", href: "/admin/payroll/inputs" },
      ],
    },
    process: {
      label: "Process",
      items: [{ title: "Payroll Process", href: "/admin/payroll/process" }],
    },
    verify: {
      label: "Verify",
      items: [
        { title: "Quick Salary Statement", href: "/admin/payroll" },
        { title: "Payroll Statement", href: "/admin/payroll" },
        { title: "Payroll Differences", href: "/admin/payroll" },
      ],
    },
    payout: {
      label: "Payout",
      items: [
        { title: "Accounts JV", href: "/admin/payroll" },
        { title: "Bank Transfer", href: "/admin/payroll" },
        { title: "PayNow Bank Transfer", href: "/admin/payroll" },
        { title: "Cheque / Cash Statement", href: "/admin/payroll" },
        { title: "Payslips", href: "/admin/payroll" },
        { title: "Hold Salary Payout", href: "/admin/payroll" },
      ],
    },
    publishedinfo: {
      label: "Published Info",
      items: [
        { title: "Payslip", href: "/admin/payroll" },
        { title: "CTC Payslip", href: "/admin/payroll" },
        { title: "Reimbursement Payslip", href: "/admin/payroll" },
        { title: "YTD Summary", href: "/admin/payroll" },
        { title: "PF YTD Statement", href: "/admin/payroll" },
        { title: "Reimbursement Statement", href: "/admin/payroll" },
        { title: "Loan Statement", href: "/admin/payroll" },
        { title: "IT Statement", href: "/admin/payroll" },
        { title: "IT Declaration", href: "/admin/payroll" },
        { title: "FBP Declaration", href: "/admin/payroll" },
      ],
    },
    admin: {
      label: "Admin",
      items: [
        { title: "Form16", href: "/admin/payroll" },
        { title: "Form 138 (Form 24Q)", href: "/admin/payroll" },
        { title: "Employee IT Declaration", href: "/admin/payroll" },
        { title: "PAN Status", href: "/admin/payroll" },
        { title: "Revision Planner", href: "/admin/payroll" },
        { title: "Remittances", href: "/admin/payroll" },
        { title: "Payroll Release", href: "/admin/payroll" },
        { title: "POI Overview", href: "/admin/payroll" },
        { title: "PF KYC Mapping", href: "/admin/payroll" },
      ],
    },
    setup: {
      label: "Setup",
      items: [
        { title: "Pay Item Group", href: "/admin/payroll" },
        { title: "Payroll Repository", href: "/admin/payroll" },
        { title: "Sort Order", href: "/admin/payroll" },
        { title: "Payslip Gallery", href: "/admin/payroll" },
      ],
    },
  };

  return (
    <>
      {/* ── Level 1 Header: Isolated greytHR Admin Topbar ── */}
      <AdminTopbar activeView="welcome" />

      {/* ── Level 2 Module Header: Secondary Navigation & Selectors ── */}
      <div
        className="border-b border-[#E4E9F0] bg-white px-4 py-2 sm:px-8 select-none z-30 relative"
        ref={menuRef}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Breadcrumbs & Secondary Nav Tabs */}
          <div className="flex items-center gap-5">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link
                href="/admin"
                className="text-[#0d6efd] hover:underline font-normal"
              >
                Home
              </Link>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Link
                href="/admin/payroll"
                className="text-[#0d6efd] hover:underline font-normal"
              >
                Payroll
              </Link>
              {currentSubTitle && (
                <>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <span className="font-medium text-slate-800">
                    {currentSubTitle}
                  </span>
                </>
              )}
            </div>

            {/* Sub Nav Items matching greytHR secondary bar */}
            <div className="hidden lg:flex items-center gap-1 text-xs relative">
              {/* Payroll Overview Tab */}
              <Link
                href="/admin/payroll"
                className={`rounded-full px-3 py-1 font-semibold transition shadow-2xs ${
                  currentTab === "overview"
                    ? "bg-[#E0F2FE] text-[#0284C7]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Payroll
              </Link>

              {/* 8 Categories */}
              {Object.entries(navCategories).map(([key, cat]) => {
                const isActive = currentTab === key;
                return (
                  <div
                    key={key}
                    className="relative"
                    onMouseEnter={() => setHoveredTab(key)}
                  >
                    <button
                      type="button"
                      className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-normal transition ${
                        isActive
                          ? "font-semibold text-[#0284C7] bg-[#E0F2FE]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {cat.label}
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                  </div>
                );
              })}

              {/* Flyout Submenu Popover */}
              {hoveredTab && navCategories[hoveredTab] && (
                <div
                  className="absolute left-20 top-full mt-1 z-50 w-64 rounded-md border border-[#E2E8F0] bg-white py-1.5 shadow-lg max-h-[380px] overflow-y-auto animate-in fade-in-50 zoom-in-95 duration-100"
                  onMouseEnter={() => setHoveredTab(hoveredTab)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1 mb-1">
                    {navCategories[hoveredTab].label}
                  </div>
                  {navCategories[hoveredTab].items.map((sub, idx) => (
                    <Link
                      key={sub.title}
                      href={sub.href}
                      onClick={() => setHoveredTab(null)}
                      className="block px-3 py-1.5 text-xs text-slate-700 hover:bg-[#F0F9FF] hover:text-[#0284C7] transition"
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Selectors & Recents matching greytHR shadow DOM */}
          <div className="flex items-center gap-3 text-xs">
            {/* Payroll Month Picker */}
            <div className="flex items-center gap-1.5 rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-slate-700 shadow-2xs">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Payroll Month:</span>
              <span className="font-semibold text-slate-900">
                {payrollMonth}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
            </div>

            {/* Employee Filter */}
            <div className="flex items-center gap-1.5 rounded border border-[#CBD5E1] bg-white px-2.5 py-1 text-slate-700 shadow-2xs">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">
                {employeeFilter}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-1" />
            </div>

            {/* History Clock */}
            <button
              type="button"
              title="Recent History"
              className="flex h-7 w-7 items-center justify-center rounded border border-[#CBD5E1] bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
