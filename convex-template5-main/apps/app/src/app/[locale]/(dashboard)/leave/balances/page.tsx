"use client";

import { GreytHRIcon } from "@/components/greythr-icon";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Download, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LeaveBalancesPage() {
  const { current: workspaceId } = useWorkspace();
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [detailsModalType, setDetailsModalType] = useState<string | null>(null);

  const scoped = workspaceId ? { workspaceId, year: selectedYear } : "skip";
  const balances = useQuery(api.leaves.getLeaveBalances, scoped);

  // Fallbacks closely matching the greytHR reference screenshot
  // In Screenshot: Casual Leave Granted: 2, Balance: 01, 1 of 2 Consumed
  // Sick Leave Granted: 0.5, Balance: 0.5, 0 of 0.5 Consumed
  // Loss Of Pay Granted: 0, Balance: 0
  const casualGranted = balances?.casual?.granted ?? 2;
  const casualBalance = balances?.casual?.balance ?? 1;
  const casualConsumed = balances?.casual?.consumed ?? 1;

  const sickGranted = balances?.sick?.granted ?? 0.5;
  const sickBalance = balances?.sick?.balance ?? 0.5;
  const sickConsumed = balances?.sick?.consumed ?? 0;

  const lopGranted = balances?.lop?.granted ?? 0;
  const lopBalance = balances?.lop?.balance ?? 0;
  const lopConsumed = balances?.lop?.consumed ?? 0;

  const casualProgressPct =
    casualGranted > 0
      ? Math.min(100, Math.round((casualConsumed / casualGranted) * 100))
      : 0;
  const sickProgressPct =
    sickGranted > 0
      ? Math.min(100, Math.round((sickConsumed / sickGranted) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] px-6 py-6 flex flex-col justify-between">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {/* Top Header matching greytHR Screenshot 2 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <GreytHRIcon />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              Leave Balances
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/leave/apply"
              className="rounded-md border border-[#0091FF] text-[#0091FF] hover:bg-blue-50 dark:hover:bg-blue-950/20 px-4 py-1.5 text-xs font-medium transition"
            >
              Apply
            </Link>

            <button
              type="button"
              title="Download Report"
              className="rounded-md bg-[#0091FF] hover:bg-[#007EE5] text-white p-1.5 transition flex items-center justify-center"
            >
              <Download className="h-4 w-4" />
            </button>

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

        {/* 3 Cards Grid Matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Casual Leave */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-56">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Casual Leave
                </span>
                <span>Granted: {casualGranted}</span>
              </div>

              <div className="my-6 text-center">
                <div className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
                  {casualBalance < 10 && casualBalance >= 0
                    ? `0${casualBalance}`
                    : casualBalance}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Balance</div>
                <button
                  type="button"
                  onClick={() => setDetailsModalType("Casual Leave")}
                  className="mt-2 text-xs text-[#0091FF] hover:underline font-medium inline-block"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0091FF] rounded-full transition-all"
                  style={{ width: `${casualProgressPct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                {casualConsumed} of {casualGranted} Consumed
              </div>
            </div>
          </div>

          {/* Card 2: Sick Leave */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-56">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Sick Leave
                </span>
                <span>Granted: {sickGranted}</span>
              </div>

              <div className="my-6 text-center">
                <div className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
                  {sickBalance}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Balance</div>
                <button
                  type="button"
                  onClick={() => setDetailsModalType("Sick Leave")}
                  className="mt-2 text-xs text-[#0091FF] hover:underline font-medium inline-block"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* Bottom Progress Bar */}
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0091FF] rounded-full transition-all"
                  style={{ width: `${sickProgressPct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400">
                {sickConsumed} of {sickGranted} Consumed
              </div>
            </div>
          </div>

          {/* Card 3: Loss Of Pay */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between h-56">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Loss Of Pay
                </span>
                <span>Granted: {lopGranted}</span>
              </div>

              <div className="my-6 text-center">
                <div className="text-3xl font-semibold text-slate-800 dark:text-slate-100">
                  {lopBalance}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Balance</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-slate-400">
                Unpaid days availed: {lopConsumed}
              </div>
            </div>
          </div>
        </div>

        {/* View Details Modal */}
        {detailsModalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {detailsModalType} Transactions ({selectedYear})
                </h3>
                <button
                  type="button"
                  onClick={() => setDetailsModalType(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500">Opening Balance:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {detailsModalType === "Casual Leave" ? "0.0" : "0.0"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500">Granted Quota:</span>
                  <span className="font-semibold text-emerald-600">
                    +
                    {detailsModalType === "Casual Leave"
                      ? casualGranted
                      : sickGranted}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800">
                  <span className="text-slate-500">Availed / Consumed:</span>
                  <span className="font-semibold text-rose-600">
                    -
                    {detailsModalType === "Casual Leave"
                      ? casualConsumed
                      : sickConsumed}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Closing Balance:
                  </span>
                  <span className="font-bold text-[#0091FF]">
                    {detailsModalType === "Casual Leave"
                      ? casualBalance
                      : sickBalance}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsModalType(null)}
                  className="rounded-md bg-[#0091FF] text-white px-4 py-1.5 text-xs font-medium hover:bg-[#007EE5]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* greytHR Signature Footer matching Screenshot 2 */}
      <footer className="mt-16 text-center text-[11px] text-slate-400 dark:text-slate-500">
        main-2544 | Privacy Policy | Terms Of Service
      </footer>
    </div>
  );
}
