"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type NavItemId =
  | "confirmation"
  | "resignations"
  | "helpdesk"
  | "leave"
  | "leave-cancel"
  | "leave-comp-off"
  | "restricted-holiday"
  | "letter-signature";

interface NavGroup {
  title: string;
  items: { id: NavItemId; label: string; displayLabel?: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "EMPINFO",
    items: [
      { id: "confirmation", label: "Confirmation" },
      { id: "resignations", label: "Resignations" },
      { id: "helpdesk", label: "Helpdesk" },
    ],
  },
  {
    title: "LEAVE",
    items: [
      { id: "leave", label: "Leave" },
      { id: "leave-cancel", label: "Leave Cancel" },
      { id: "leave-comp-off", label: "Leave Comp Off" },
      { id: "restricted-holiday", label: "Restricted Holiday" },
    ],
  },
  {
    title: "LETTER",
    items: [
      {
        id: "letter-signature",
        label: "Letter Signature Approval",
        displayLabel: "Letter Signature App...",
      },
    ],
  },
];

export default function ReviewPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const myLeaves = useQuery(api.leaves.getMyLeaves, scoped);
  const myTickets = useQuery(api.helpdesk.listMyTickets, scoped);

  // Filter and selection states
  const [selectedSection, setSelectedSection] =
    useState<NavItemId>("confirmation");
  const [statusFilter, setStatusFilter] = useState<"active" | "closed">(
    "active",
  );
  const [dateRange, setDateRange] = useState("");
  const [searchEmployee, setSearchEmployee] = useState("");

  // Determine current section label
  const currentItem = useMemo(() => {
    for (const group of NAV_GROUPS) {
      const found = group.items.find((item) => item.id === selectedSection);
      if (found) return found;
    }
    return { id: "confirmation" as NavItemId, label: "Confirmation" };
  }, [selectedSection]);

  // Helpdesk items for employee
  const filteredTickets = useMemo(() => {
    if (!myTickets) return [];
    return myTickets.filter((t) => {
      // Active = open, in_progress; Closed = resolved, closed
      const isStatusMatch =
        statusFilter === "active"
          ? t.status === "open" || t.status === "in_progress"
          : t.status === "resolved" || t.status === "closed";
      if (!isStatusMatch) return false;

      if (searchEmployee.trim()) {
        const query = searchEmployee.toLowerCase();
        const subjectMatch = t.subject.toLowerCase().includes(query);
        const ticketNumMatch = t.ticketNumber.toLowerCase().includes(query);
        const catMatch = t.category.toLowerCase().includes(query);
        if (!subjectMatch && !ticketNumMatch && !catMatch) return false;
      }
      return true;
    });
  }, [myTickets, statusFilter, searchEmployee]);

  // Leave items for employee
  const filteredLeaves = useMemo(() => {
    if (!myLeaves) return [];
    return myLeaves.filter((l) => {
      // Active = pending; Closed = approved, rejected
      const isStatusMatch =
        statusFilter === "active"
          ? l.status === "pending"
          : l.status === "approved" || l.status === "rejected";
      if (!isStatusMatch) return false;

      if (searchEmployee.trim()) {
        const query = searchEmployee.toLowerCase();
        const typeMatch = l.leaveType.toLowerCase().includes(query);
        const reasonMatch = (l.reason || "").toLowerCase().includes(query);
        if (!typeMatch && !reasonMatch) return false;
      }
      return true;
    });
  }, [myLeaves, statusFilter, searchEmployee]);

  if (!workspaceId) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Select a workspace to view reviews.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#F9FAFB] dark:bg-black">
      {/* greytHR Header with Folded Ribbon Icon */}
      <div className="flex items-center justify-between border-b border-border/80 bg-card px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center">
            <svg
              width="16"
              height="20"
              viewBox="0 0 16 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
              aria-hidden="true"
            >
              <path d="M0 0H16V20L8 15L0 20V0Z" fill="#00C49F" />
            </svg>
          </div>
          <h1 className="text-base font-semibold text-primary">Review</h1>
        </div>
      </div>

      {/* Main Review Layout */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-6 md:flex-row md:gap-8 md:p-8">
        {/* Left Secondary Navigation */}
        <aside className="w-full shrink-0 space-y-6 md:w-52">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h2 className="mb-2 text-[11px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase select-none">
                {group.title}
              </h2>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = selectedSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedSection(item.id)}
                      className={`group flex w-full items-center text-left text-sm transition ${
                        isActive
                          ? "border-l-[3px] border-gray-900 pl-2.5 font-semibold text-gray-900 dark:border-white dark:text-white"
                          : "pl-3 font-normal text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      } py-1.5`}
                    >
                      <span className="truncate">
                        {item.displayLabel || item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 space-y-4">
          {/* Top Filters Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Active / Closed Segmented Switch (Aligned Right on desktop) */}
            <div className="flex w-full justify-end sm:order-2">
              <div className="inline-flex rounded-md shadow-2xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`rounded-l-md px-6 py-2 text-xs font-semibold transition ${
                    statusFilter === "active"
                      ? "bg-[#0091FF] text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300"
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("closed")}
                  className={`rounded-r-md border border-l-0 border-gray-200 px-6 py-2 text-xs font-semibold transition dark:border-border ${
                    statusFilter === "closed"
                      ? "border-[#0091FF] bg-[#0091FF] text-white shadow-xs"
                      : "bg-white text-gray-600 hover:bg-gray-50 dark:bg-card dark:text-gray-300"
                  }`}
                >
                  Closed
                </button>
              </div>
            </div>
          </div>

          {/* Date range & Employee Search Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3 pb-2">
            {/* Date Range Picker Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Select date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-56 rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
              />
              <CalendarIcon className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            {/* Search Employee Input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search Employee"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="w-56 rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0091FF] dark:border-border dark:bg-card dark:text-gray-200"
              />
              <Search className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* Main Review Content Box */}
          <div className="flex min-h-[440px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-8 shadow-2xs md:p-12 dark:border-border dark:bg-card">
            {/* If section is Helpdesk and records exist */}
            {selectedSection === "helpdesk" && filteredTickets.length > 0 ? (
              <div className="w-full space-y-3 self-start">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-border/60">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Helpdesk Requests ({filteredTickets.length})
                  </span>
                  <Link
                    href="/helpdesk"
                    className="flex items-center gap-1 text-xs text-[#0091FF] hover:underline"
                  >
                    <span>Open Helpdesk</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {filteredTickets.map((t) => (
                  <div
                    key={t._id}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 bg-[#FAFAFA] p-4 transition sm:flex-row sm:items-center dark:border-border/60 dark:bg-muted/30"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                          #{t.ticketNumber}
                        </span>
                        <span className="truncate text-xs font-semibold text-primary">
                          {t.subject}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            t.status === "open"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : t.status === "in_progress"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {t.description}
                      </p>
                    </div>
                    <Link
                      href="/helpdesk"
                      className="inline-flex items-center gap-1 self-start rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : selectedSection === "leave" && filteredLeaves.length > 0 ? (
              /* If section is Leave and records exist */
              <div className="w-full space-y-3 self-start">
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-border/60">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Leave Reviews ({filteredLeaves.length})
                  </span>
                  <Link
                    href="/leave"
                    className="flex items-center gap-1 text-xs text-[#0091FF] hover:underline"
                  >
                    <span>Open Leave Module</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
                {filteredLeaves.map((l) => (
                  <div
                    key={l._id}
                    className="flex flex-col justify-between gap-3 rounded-lg border border-gray-100 bg-[#FAFAFA] p-4 transition sm:flex-row sm:items-center dark:border-border/60 dark:bg-muted/30"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary capitalize">
                          {l.leaveType} Leave
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {l.startDate} to {l.endDate} ({l.daysCount} days)
                        </span>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            l.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : l.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {l.reason || "No reason provided"}
                      </p>
                    </div>
                    <Link
                      href="/leave"
                      className="inline-flex items-center gap-1 self-start rounded border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-border dark:bg-card dark:text-gray-300"
                    >
                      <span>View</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              /* greytHR Empty-State Illustration & Text */
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-2 flex items-center justify-center">
                  <svg
                    width="260"
                    height="170"
                    viewBox="0 0 260 170"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="select-none"
                    aria-hidden="true"
                  >
                    {/* Background Soft Glow */}
                    <circle cx="150" cy="90" r="60" fill="#F8FAFC" />

                    {/* Floating Crosses & Plus Accents */}
                    <path
                      d="M215 28H223M219 24V32"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M26 68L34 76M34 68L26 76"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M228 108H236M232 104V112"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="15" cy="125" r="2.5" fill="#CBD5E1" />
                    <circle cx="242" cy="72" r="3" fill="#CBD5E1" />

                    {/* Left Calendar Pad Card */}
                    <g transform="translate(30, 75)">
                      {/* Calendar Binder Base */}
                      <rect
                        x="0"
                        y="10"
                        width="64"
                        height="64"
                        rx="8"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="2.5"
                      />
                      {/* Top Header Strip */}
                      <path
                        d="M0 18C0 13.5817 3.58172 10 8 10H56C60.4183 10 64 13.5817 64 18V24H0V18Z"
                        fill="#F1F5F9"
                        stroke="#CBD5E1"
                        strokeWidth="2.5"
                      />
                      {/* Top Spiral Rings */}
                      <rect
                        x="12"
                        y="4"
                        width="5"
                        height="10"
                        rx="2"
                        fill="#94A3B8"
                      />
                      <rect
                        x="29"
                        y="4"
                        width="5"
                        height="10"
                        rx="2"
                        fill="#94A3B8"
                      />
                      <rect
                        x="46"
                        y="4"
                        width="5"
                        height="10"
                        rx="2"
                        fill="#94A3B8"
                      />
                      {/* Circled 'X' Symbol */}
                      <circle
                        cx="32"
                        cy="48"
                        r="14"
                        fill="#F8FAFC"
                        stroke="#CBD5E1"
                        strokeWidth="2"
                      />
                      <path
                        d="M26 42L38 54M38 42L26 54"
                        stroke="#94A3B8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </g>

                    {/* Main Computer / Laptop Screen */}
                    <g transform="translate(90, 38)">
                      {/* Outer Monitor Frame */}
                      <rect
                        x="0"
                        y="0"
                        width="132"
                        height="94"
                        rx="8"
                        fill="#FFFFFF"
                        stroke="#CBD5E1"
                        strokeWidth="2.5"
                      />
                      {/* Inner Screen Area */}
                      <rect
                        x="8"
                        y="8"
                        width="116"
                        height="78"
                        rx="4"
                        fill="#F8FAFC"
                      />

                      {/* Video / Profile Silhouette Badge */}
                      <g transform="translate(66, 42)">
                        {/* Profile Head */}
                        <circle
                          cx="0"
                          cy="-6"
                          r="10"
                          fill="#E2E8F0"
                          stroke="#94A3B8"
                          strokeWidth="2"
                        />
                        {/* Profile Body / Shoulder Curve */}
                        <path
                          d="M-15 16C-15 8 -8 4 0 4C8 4 15 8 15 16"
                          fill="#E2E8F0"
                          stroke="#94A3B8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>

                      {/* Content Bar Placeholders */}
                      <rect
                        x="34"
                        y="66"
                        width="64"
                        height="4"
                        rx="2"
                        fill="#E2E8F0"
                      />
                      <rect
                        x="46"
                        y="74"
                        width="40"
                        height="3"
                        rx="1.5"
                        fill="#E2E8F0"
                      />

                      {/* Monitor Base Plate & Stand */}
                      <path
                        d="M-12 94H144C147 94 149 96 148 99L143 105H-11L-16 99C-17 96 -15 94 -12 94Z"
                        fill="#E2E8F0"
                        stroke="#CBD5E1"
                        strokeWidth="2"
                      />
                      <rect
                        x="56"
                        y="94"
                        width="20"
                        height="3"
                        rx="1.5"
                        fill="#CBD5E1"
                      />
                    </g>

                    {/* Floating Speech Bubble Above Monitor */}
                    <g transform="translate(108, 12)">
                      <rect
                        x="0"
                        y="0"
                        width="58"
                        height="36"
                        rx="10"
                        fill="#FFFFFF"
                        stroke="#94A3B8"
                        strokeWidth="2"
                      />
                      {/* Tail */}
                      <path
                        d="M14 35L17 44L24 35"
                        fill="#FFFFFF"
                        stroke="#94A3B8"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      {/* Inner mask to clean tail overlap */}
                      <path d="M13 34H25V36H13Z" fill="#FFFFFF" />
                      {/* Three Dots (...) */}
                      <circle cx="18" cy="18" r="3" fill="#94A3B8" />
                      <circle cx="29" cy="18" r="3" fill="#94A3B8" />
                      <circle cx="40" cy="18" r="3" fill="#94A3B8" />
                    </g>
                  </svg>
                </div>

                {/* greytHR Empty State Wording */}
                <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">
                  {selectedSection === "confirmation"
                    ? "Nothing to show! You've got no confirmation to review yet."
                    : `Nothing to show! You've got no ${currentItem.label.toLowerCase()} to review yet.`}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
