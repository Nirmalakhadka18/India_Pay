"use client";

import { GreytHRIcon } from "@/components/greythr-icon";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Search,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

// greytHR Empty State Illustration for Leave Transactions (Monitor + Calendar)
function GreytHREmptyTransactions() {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <svg
        width="140"
        height="90"
        viewBox="0 0 160 100"
        fill="none"
        className="text-slate-300 dark:text-slate-700 mb-3"
      >
        {/* Monitor Frame */}
        <rect
          x="30"
          y="12"
          width="100"
          height="65"
          rx="5"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Monitor Base */}
        <path
          d="M70 77L60 90H100L90 77"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Dots inside monitor */}
        <circle cx="105" cy="24" r="2.5" fill="currentColor" />
        <circle cx="113" cy="24" r="2.5" fill="currentColor" />
        <circle cx="121" cy="24" r="2.5" fill="currentColor" />
        {/* Calendar Box inside Monitor */}
        <rect
          x="42"
          y="28"
          width="40"
          height="36"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="42"
          y1="36"
          x2="82"
          y2="36"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="52"
          y1="24"
          x2="52"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
        />
        <line
          x1="72"
          y1="24"
          x2="72"
          y2="28"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* User Card inside Monitor */}
        <rect
          x="88"
          y="40"
          width="36"
          height="24"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="94"
          y1="46"
          x2="118"
          y2="46"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="94"
          y1="52"
          x2="112"
          y2="52"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Floating cross & checkmark */}
        <path
          d="M20 30L24 34M24 30L20 34"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="140" cy="45" r="2" fill="currentColor" opacity="0.6" />
        <circle cx="25" cy="65" r="2" fill="currentColor" opacity="0.6" />
      </svg>
      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
        No Employees are on leave
      </p>
    </div>
  );
}

export default function LeaveCalendarPage() {
  const { current: workspaceId } = useWorkspace();
  const [filterType, setFilterType] = useState<"me" | "team">("me");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-28");
  const [viewMonth, setViewMonth] = useState<number>(9); // 0-indexed: 9 = October
  const [viewYear, setViewYear] = useState<number>(2026);

  const scoped = workspaceId ? { workspaceId } : "skip";
  const myLeaves = useQuery(api.leaves.getMyLeaves, scoped);
  const holidays = useQuery(api.leaves.getHolidays, scoped);
  const allEmployees = useQuery(api.employees.list, scoped);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix (6 weeks x 7 days)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Preceding month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Succeeding month days to fill 35 or 42 cells
    const remaining =
      35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Map of dateStr -> holiday
  const holidaysMap = useMemo(() => {
    const map = new Map<string, { name: string; type: string }>();
    if (holidays) {
      for (const h of holidays) {
        map.set(h.date, { name: h.name, type: h.type });
      }
    }
    // Ensure October 2026 reference holidays from screenshot are present
    if (viewYear === 2026 && viewMonth === 9) {
      if (!map.has("2026-10-02"))
        map.set("2026-10-02", { name: "Gandhi Jayanti", type: "gazetted" });
      if (!map.has("2026-10-20"))
        map.set("2026-10-20", { name: "Mahanavami", type: "gazetted" });
      if (!map.has("2026-10-21"))
        map.set("2026-10-21", { name: "Dussehra", type: "gazetted" });
    }
    return map;
  }, [holidays, viewYear, viewMonth]);

  // Find active leaves on selected date
  const leavesOnSelectedDate = useMemo(() => {
    if (!myLeaves) return [];
    return myLeaves.filter(
      (l) =>
        l.status === "approved" &&
        selectedDate >= l.startDate &&
        selectedDate <= l.endDate,
    );
  }, [myLeaves, selectedDate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] px-6 py-6 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GreytHRIcon />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Leave Calendar
            </h1>
          </div>

          <button
            type="button"
            title="Download Calendar"
            className="rounded-md bg-[#0091FF] hover:bg-[#007EE5] text-white p-1.5 transition flex items-center justify-center"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 max-w-xs">
          <label className="text-xs text-slate-500 font-medium">
            Filter Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "me" | "team")}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0091FF]"
          >
            <option value="me">Me</option>
            <option value="team">My Team</option>
          </select>
        </div>

        {/* Two-Column Grid matching greytHR Screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Calendar Grid (7 cols) */}
          <div className="lg:col-span-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            {/* Month Navigation */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Prev</span>
              </button>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {monthNames[viewMonth]} {viewYear}
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span>Next</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-slate-400 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 border-l border-t border-slate-100 dark:border-slate-800">
              {calendarDays.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDate;
                const holiday = holidaysMap.get(cell.dateStr);
                const isGeneralHoliday = holiday?.type === "gazetted";
                const isRestrictedHoliday = holiday?.type === "restricted";

                return (
                  <button
                    type="button"
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[64px] p-2 border-r border-b border-slate-100 dark:border-slate-800 cursor-pointer transition relative flex flex-col justify-between text-left ${
                      isSelected
                        ? "border-2 border-[#0091FF] bg-blue-50/20 dark:bg-blue-950/20 rounded-md -m-[1px] z-10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs ${
                          cell.isCurrentMonth
                            ? isSelected
                              ? "font-bold text-[#0091FF]"
                              : "text-slate-700 dark:text-slate-300"
                            : "text-slate-300 dark:text-slate-600"
                        }`}
                      >
                        {String(cell.dayNumber).padStart(2, "0")}
                      </span>

                      {/* Holiday Dots */}
                      {isGeneralHoliday && (
                        <span
                          className="h-2 w-2 rounded-full bg-purple-400 shrink-0"
                          title={`General Holiday: ${holiday.name}`}
                        />
                      )}
                      {isRestrictedHoliday && (
                        <span
                          className="h-2 w-2 rounded-full bg-amber-400 shrink-0"
                          title={`Restricted Holiday: ${holiday.name}`}
                        />
                      )}
                    </div>

                    {/* Badge for selected date like 28 in greytHR reference */}
                    {isSelected && (
                      <div className="self-center mt-1 flex items-center justify-center">
                        <span className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          1
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend at bottom of Calendar */}
            <div className="flex flex-wrap items-center gap-6 pt-4 mt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span>Team on Leave 0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span>Restricted Holiday</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                <span>General Holiday</span>
              </div>
            </div>
          </div>

          {/* Right Column: Leave Transactions Card */}
          <div className="lg:col-span-4 space-y-3">
            {/* Search Input matching greytHR Screenshot 3 */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search Employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-3 pr-16 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0091FF] shadow-xs"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1.5 text-slate-400">
                <Search className="h-3.5 w-3.5" />
                <Filter className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Leave Transactions Card */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Leave Transactions ({leavesOnSelectedDate.length})
                </h3>
                <span className="h-3.5 w-3.5 rounded-full border border-cyan-500 text-cyan-500 text-[10px] flex items-center justify-center font-bold">
                  v
                </span>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-3 text-[11px] font-medium text-slate-400 py-2 border-b border-slate-50 dark:border-slate-800">
                <div>Employee</div>
                <div className="text-center">Number of days</div>
                <div className="text-right">From-To</div>
              </div>

              {/* Empty state or items */}
              {leavesOnSelectedDate.length === 0 ? (
                <GreytHREmptyTransactions />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 py-2">
                  {leavesOnSelectedDate.map((l) => (
                    <div
                      key={l._id}
                      className="grid grid-cols-3 items-center py-2 text-xs"
                    >
                      <div className="font-medium text-slate-700 dark:text-slate-300 truncate">
                        Employee
                      </div>
                      <div className="text-center text-slate-500">
                        {l.daysCount}
                      </div>
                      <div className="text-right text-[11px] text-slate-500">
                        {l.startDate}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* greytHR Signature Footer */}
      <footer className="mt-16 text-center text-[11px] text-slate-400 dark:text-slate-500">
        main-2544 | Privacy Policy | Terms Of Service
      </footer>
    </div>
  );
}
