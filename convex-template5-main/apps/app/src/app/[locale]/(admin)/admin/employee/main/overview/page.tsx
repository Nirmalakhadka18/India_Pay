"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Gift,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  Mail,
  MoreVertical,
  Package,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Smartphone,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmployeeHeader } from "../../employee-header";

export default function EmployeeOverviewPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;
  const currentWorkspace = workspaces.find(
    (w) => w._id === effectiveWorkspaceId,
  );

  // Queries
  const employees = useQuery(
    api.employees.list,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );
  const adminData = useQuery(
    api.dashboard.adminOperations,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip",
  );

  const [helpOpen, setHelpOpen] = useState(true);
  const [payrollMonth, setPayrollMonth] = useState("Nov'26");
  const [employeeFilter, setEmployeeFilter] = useState("All");

  const totalEmployees = employees?.length ?? 33;
  const activeEmployees = employees?.filter((e) => e.status === "active") ?? [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      {/* ── Employee Universal Navigation Header ── */}
      <EmployeeHeader currentCategory="overview" currentPageTitle="Overview" />

      {/* ── Level 3: Informational Help Banner (Dismissible) ── */}
      {helpOpen && (
        <div className="mx-4 sm:mx-8 mt-3 rounded-md border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-2.5 text-xs text-[#0369A1] shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 shrink-0 text-[#0284C7]" />
              <p>
                The <span className="font-semibold">Overview</span> page guides
                you through an overview of your organization&apos;s day-to-day
                HR activities including lifecycle events like additions,
                separations, etc. Explore the Employee Overview page with{" "}
                <a
                  href="#help-doc"
                  className="text-[#0284C7] underline font-medium"
                >
                  Help-Doc
                </a>
                ,{" "}
                <a
                  href="#videos"
                  className="text-[#0284C7] underline font-medium"
                >
                  How-to Videos
                </a>{" "}
                and{" "}
                <a
                  href="#faqs"
                  className="text-[#0284C7] underline font-medium"
                >
                  FAQs
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="text-xs font-medium text-[#0284C7] hover:underline ml-4 shrink-0"
            >
              Hide Help
            </button>
          </div>
        </div>
      )}

      {/* ── Level 4: Analytics Dashboard Row (5 Sections) ── */}
      <div className="mx-4 sm:mx-8 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          {/* 1. Employees Head Count (Col span 8) */}
          <div className="lg:col-span-8 rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
            <div className="text-[13px] font-semibold text-slate-800 mb-1">
              Employees Head Count
            </div>
            <div className="relative h-[120px] w-full">
              <svg
                viewBox="0 0 650 120"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="30"
                  y1="20"
                  x2="620"
                  y2="20"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="45"
                  x2="620"
                  y2="45"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="70"
                  x2="620"
                  y2="70"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="30"
                  y1="95"
                  x2="620"
                  y2="95"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {/* Y labels */}
                <text
                  x="24"
                  y="24"
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  40
                </text>
                <text
                  x="24"
                  y="49"
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  32
                </text>
                <text
                  x="24"
                  y="74"
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  24
                </text>
                <text
                  x="24"
                  y="99"
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Line */}
                <polyline
                  fill="none"
                  stroke="#00ACC1"
                  strokeWidth="2"
                  points="50,43 325,43 600,43"
                />
                <circle cx="50" cy="43" r="3.5" fill="#00ACC1" />
                <circle cx="325" cy="43" r="3.5" fill="#00ACC1" />
                <circle cx="600" cy="43" r="3.5" fill="#00ACC1" />

                {/* X labels */}
                <text x="50" y="112" fontSize="9" fill="#64748B">
                  Sep
                </text>
                <text
                  x="325"
                  y="112"
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="middle"
                >
                  Oct
                </text>
                <text
                  x="600"
                  y="112"
                  fontSize="9"
                  fill="#64748B"
                  textAnchor="end"
                >
                  Nov
                </text>
              </svg>
            </div>
          </div>

          {/* 2. Helpdesk Stats of 3 Months (Col span 4) */}
          <div className="lg:col-span-4 rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="text-[26px] font-bold text-slate-900 leading-tight">
                0
              </div>
              <div className="text-[12px] font-medium text-slate-700">
                Helpdesk Stats of 3 Months
              </div>
              <div className="text-[11px] text-[#059669] mt-0.5">
                0% vs Previous month
              </div>
            </div>

            <div className="mt-4 flex items-center justify-around border-t border-slate-100 pt-3 text-center">
              <div>
                <div className="text-[16px] font-bold text-slate-800">0</div>
                <div className="text-[10px] text-slate-500">Ticket Raised</div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <div className="text-[16px] font-bold text-slate-800">0</div>
                <div className="text-[10px] text-slate-500">Ticket Solved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 of Analytics (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 mt-3.5">
          {/* 3. Employees Login Stats of 3 Months (Col span 5) */}
          <div className="lg:col-span-5 rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold text-slate-900 leading-tight">
                50
              </span>
              <span className="text-[11px] text-[#E11D48]">
                -63% vs Previous month
              </span>
            </div>
            <div className="text-[12px] font-medium text-slate-700 mb-2">
              Employees Login Stats of 3 Months
            </div>

            <div className="relative h-[110px] w-full">
              <svg
                viewBox="0 0 450 110"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <line
                  x1="25"
                  y1="20"
                  x2="430"
                  y2="20"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="25"
                  y1="50"
                  x2="430"
                  y2="50"
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <line
                  x1="25"
                  y1="80"
                  x2="430"
                  y2="80"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                <text
                  x="20"
                  y="24"
                  fontSize="8"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  20
                </text>
                <text
                  x="20"
                  y="54"
                  fontSize="8"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  10
                </text>
                <text
                  x="20"
                  y="84"
                  fontSize="8"
                  fill="#94A3B8"
                  textAnchor="end"
                >
                  0
                </text>

                {/* Purple Last Month curve */}
                <path
                  d="M40,50 Q110,80 180,60 T320,68 T420,78"
                  fill="none"
                  stroke="#C084FC"
                  strokeWidth="1.5"
                />
                <circle cx="40" cy="50" r="2.5" fill="#C084FC" />
                <circle cx="180" cy="60" r="2.5" fill="#C084FC" />
                <circle cx="320" cy="68" r="2.5" fill="#C084FC" />
                <circle cx="420" cy="78" r="2.5" fill="#C084FC" />

                {/* Cyan Current Month curve */}
                <path
                  d="M40,75 Q110,35 180,45 T320,40 T420,55"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                />
                <circle cx="40" cy="75" r="2.5" fill="#38BDF8" />
                <circle cx="110" cy="38" r="2.5" fill="#38BDF8" />
                <circle cx="180" cy="45" r="2.5" fill="#38BDF8" />
                <circle cx="320" cy="40" r="2.5" fill="#38BDF8" />
                <circle cx="420" cy="55" r="2.5" fill="#38BDF8" />

                {/* X labels */}
                {["5", "10", "15", "20", "25", "30"].map((day, i) => (
                  <text
                    key={day}
                    x={40 + i * 76}
                    y="98"
                    fontSize="8"
                    fill="#64748B"
                    textAnchor="middle"
                  >
                    {day}
                  </text>
                ))}
              </svg>
            </div>
            <div className="flex items-center justify-end gap-3 text-[10px] text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#C084FC]" /> Last
                month
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]" /> Current
                month
              </span>
            </div>
          </div>

          {/* 4. Letters Generated Stats of 3 Months (Col span 3) */}
          <div className="lg:col-span-3 rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-slate-900 leading-tight">
                  0
                </span>
                <span className="text-[11px] text-[#059669]">
                  0% vs Previous month
                </span>
              </div>
              <div className="text-[12px] font-medium text-slate-700">
                Letters Generated Stats of 3 Months
              </div>
            </div>

            <div className="relative h-[80px] w-full border-b border-slate-100 flex items-end justify-around pb-2 text-[10px] text-slate-400">
              <span>Sep</span>
              <span>Oct</span>
              <span>Nov</span>
            </div>
            <div className="text-[10px] text-slate-400 text-center">
              Letter Generated
            </div>
          </div>

          {/* 5. Mobile App Users (Col span 4) */}
          <div className="lg:col-span-4 rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs">
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-bold text-slate-900 leading-tight">
                4
              </span>
              <span className="text-[11px] text-[#E11D48]">
                -50% vs Previous month
              </span>
            </div>
            <div className="text-[12px] font-medium text-slate-700 mb-3">
              Mobile App Users
            </div>

            <div className="flex items-center gap-4">
              {/* Donut chart */}
              <div className="relative h-20 w-20 shrink-0">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="3.8"
                  />
                  {/* Lavender active segment (4/33 = ~12%) */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9155"
                    fill="none"
                    stroke="#C084FC"
                    strokeWidth="3.8"
                    strokeDasharray="12 88"
                    strokeDashoffset="0"
                  />
                </svg>
              </div>

              {/* Text & Invite More button */}
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  4 out of 33
                </div>
                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  employees are using the ESS mobile app
                </div>
                <button
                  type="button"
                  className="mt-2 text-xs font-medium text-[#0284C7] hover:underline"
                >
                  Invite More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Level 5: Employee Lifecycle Feeds (2-Column & 3-Column Layouts) ── */}
      <div className="mx-4 sm:mx-8 mt-4 pb-12 space-y-4">
        {/* ROW 1: New Joiners (Left 50%) & Upcoming Birthdays (Center 50%) & Confirmation Due (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card A: New Joiners for Last 1 Month */}
          <div className="rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[13px] font-semibold text-slate-800">
                  New Joiners for Last 1 Month
                </span>
                <Link
                  href="/employees/onboarding"
                  className="text-xs font-medium text-[#0284C7] hover:underline"
                >
                  Add
                </Link>
              </div>

              {/* Employee Item */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold text-xs">
                    NK
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-slate-900">
                      Nirmala Khadka
                    </div>
                    <div className="text-[11px] text-slate-500">
                      (VC-OL-024)
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">16 days ago</span>
              </div>
            </div>
          </div>

          {/* Card B: Upcoming Birthdays for a week */}
          <div className="rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="pb-2 border-b border-slate-100 text-[13px] font-semibold text-slate-800">
                Upcoming Birthdays for a week
              </div>

              <div className="mt-2.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                      CV
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 truncate max-w-[170px]">
                        Chauhan Vandana...
                      </div>
                      <div className="text-[10px] text-slate-500">
                        (NH-OL-655)
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    19 Nov 2026
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-semibold text-[10px]">
                      SS
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 truncate max-w-[170px]">
                        Sumeet Sangam
                      </div>
                      <div className="text-[10px] text-slate-500">
                        (NH-OL-644)
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    20 Nov 2026
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card C: Confirmation due for next 1 Month */}
          <div className="rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="pb-2 border-b border-slate-100 text-[13px] font-semibold text-slate-800">
                Confirmation due for next 1 Month
              </div>

              {/* Empty state package icon */}
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-10 w-10 text-slate-300 stroke-[1.2]" />
                <span className="mt-2 text-xs text-slate-500">
                  No employee confirmation is pending.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: Resigned Employees (Left 50%) & Joining Anniversary (Right 50%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card D: Resigned Employees for Last 1 Month */}
          <div className="rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[13px] font-semibold text-slate-800">
                  Resigned Employees for Last 1 Month
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-[#0284C7] hover:underline"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-10 w-10 text-slate-300 stroke-[1.2]" />
                <span className="mt-2 text-xs text-slate-500">
                  No employee resignation to show.
                </span>
              </div>
            </div>
          </div>

          {/* Card E: Joining Anniversary for a week */}
          <div className="rounded border border-[#E2E8F0] bg-white p-3.5 shadow-2xs flex flex-col justify-between min-h-[170px]">
            <div>
              <div className="pb-2 border-b border-slate-100 text-[13px] font-semibold text-slate-800">
                Joining Anniversary for a week
              </div>

              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Package className="h-10 w-10 text-slate-300 stroke-[1.2]" />
                <span className="mt-2 text-xs text-slate-500">
                  No joining anniversary to show.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
