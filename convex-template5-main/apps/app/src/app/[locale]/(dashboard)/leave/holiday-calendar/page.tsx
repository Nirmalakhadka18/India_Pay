"use client";

import { GreytHRIcon } from "@/components/greythr-icon";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";

interface HolidayItem {
  date: string; // YYYY-MM-DD
  dayNum: string; // e.g. "26" or "01"
  dayName: string; // e.g. "Mon"
  name: string;
}

// Exact 2026 Statutory Holidays from greytHR Reference Screenshot
const REFERENCE_HOLIDAYS_2026: Record<number, HolidayItem[]> = {
  0: [
    { date: "2026-01-26", dayNum: "26", dayName: "Mon", name: "Republic Day" },
  ],
  1: [],
  2: [],
  3: [],
  4: [
    {
      date: "2026-05-01",
      dayNum: "01",
      dayName: "Fri",
      name: "May Day (Labour Day) / Buddha Purnima",
    },
  ],
  5: [],
  6: [],
  7: [
    {
      date: "2026-08-15",
      dayNum: "15",
      dayName: "Sat",
      name: "Independence Day",
    },
    { date: "2026-08-26", dayNum: "26", dayName: "Wed", name: "Onam" },
    { date: "2026-08-28", dayNum: "28", dayName: "Fri", name: "Rakshabandhan" },
  ],
  8: [
    {
      date: "2026-09-14",
      dayNum: "14",
      dayName: "Mon",
      name: "Ganesh Chaturthi",
    },
  ],
  9: [
    {
      date: "2026-10-02",
      dayNum: "02",
      dayName: "Fri",
      name: "Gandhi Jayanti",
    },
    { date: "2026-10-20", dayNum: "20", dayName: "Tue", name: "Mahanavami" },
  ],
  10: [
    { date: "2026-11-06", dayNum: "06", dayName: "Fri", name: "Diwali" },
    { date: "2026-11-07", dayNum: "07", dayName: "Sat", name: "Diwali" },
  ],
  11: [
    { date: "2026-12-25", dayNum: "25", dayName: "Fri", name: "Christmas Day" },
    { date: "2026-12-31", dayNum: "31", dayName: "Thu", name: "New Year" },
  ],
};

const MONTH_NAMES = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HolidayCalendarPage() {
  const { current: workspaceId } = useWorkspace();
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  const scoped = workspaceId ? { workspaceId, year: selectedYear } : "skip";
  const backendHolidays = useQuery(api.leaves.getHolidays, scoped);

  // Group backend holidays by month (0-11)
  const holidaysByMonth = useMemo(() => {
    const grouped: Record<number, HolidayItem[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
      10: [],
      11: [],
    };

    if (selectedYear === 2026) {
      // Use exact reference holidays as baseline
      for (let m = 0; m < 12; m++) {
        grouped[m] = [...(REFERENCE_HOLIDAYS_2026[m] || [])];
      }
    }

    // Merge any custom holidays added in backend database
    if (backendHolidays) {
      for (const h of backendHolidays) {
        const parts = h.date.split("-");
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const d = parts[2] ?? "01";
        if (y === selectedYear && m >= 0 && m < 12) {
          const targetMonth = grouped[m];
          if (targetMonth) {
            const dateObj = new Date(y, m, Number(d));
            const dayName = DAY_ABBR[dateObj.getDay()] ?? "Mon";
            const exists = targetMonth.some((item) => item.date === h.date);
            if (!exists) {
              targetMonth.push({
                date: h.date,
                dayNum: d,
                dayName,
                name: h.name,
              });
            }
          }
        }
      }
    }

    // Sort items inside each month by date
    for (let m = 0; m < 12; m++) {
      const monthList = grouped[m];
      if (monthList) {
        monthList.sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    return grouped;
  }, [backendHolidays, selectedYear]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] px-6 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Top Header matching greytHR Screenshot 4 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GreytHRIcon />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Holiday Calendar
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0091FF]"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>

        {/* 12 Month Cards Grid (4 cols x 3 rows) matching Screenshot 4 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MONTH_NAMES.map((monthAbbr, monthIdx) => {
            const list = holidaysByMonth[monthIdx] || [];
            const hasHolidays = list.length > 0;

            return (
              <div
                key={monthAbbr}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex flex-col justify-between min-h-[140px]"
              >
                {/* Month Card Header */}
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 tracking-wide uppercase">
                    {monthAbbr} {selectedYear}
                  </div>

                  {/* Holidays or "No Holidays" */}
                  {hasHolidays ? (
                    <div className="space-y-3">
                      {list.map((h) => (
                        <div
                          key={`${h.name}-${h.date}`}
                          className="flex items-start gap-3"
                        >
                          <div className="shrink-0 text-left">
                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
                              {h.dayNum}
                            </span>
                            <span className="block text-[11px] text-slate-400 leading-tight">
                              {h.dayName}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-snug">
                              {h.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-6">
                      <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">
                        No Holidays
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
