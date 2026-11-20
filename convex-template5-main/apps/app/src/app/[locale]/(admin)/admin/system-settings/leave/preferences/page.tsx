"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Save,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LeavePreferencesPage() {
  const [showHelp, setShowHelp] = useState(true);
  const data = useQuery(api.systemSettings.getLeavePreferences);
  const updateSettings = useMutation(api.systemSettings.updateLeavePreferences);

  const [startMonth, setStartMonth] = useState(1);
  const [carryForward, setCarryForward] = useState(true);
  const [maxCarry, setMaxCarry] = useState(15);
  const [encashment, setEncashment] = useState(true);
  const [probationLeave, setProbationLeave] = useState(false);
  const [negativeBalance, setNegativeBalance] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      setStartMonth(data.leaveYearStartMonth || 1);
      setCarryForward(data.enableCarryForward ?? true);
      setMaxCarry(data.maxCarryForwardDays || 15);
      setEncashment(data.enableEncashment ?? true);
      setProbationLeave(data.probationLeaveAllowed ?? false);
      setNegativeBalance(data.negativeBalanceAllowed ?? false);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({
        leaveYearStartMonth: Number(startMonth),
        enableCarryForward: carryForward,
        maxCarryForwardDays: Number(maxCarry),
        enableEncashment: encashment,
        probationLeaveAllowed: probationLeave,
        negativeBalanceAllowed: negativeBalance,
      });
      setFeedback({
        type: "success",
        text: "Leave policies updated successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update leave policies",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin" className="hover:text-blue-600 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span>System Settings</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Leave Options</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">
                Leave &amp; Attendance Policy
              </p>
              <p className="text-sky-800 leading-relaxed">
                Configure annual leave year rollover cycles, carry forward
                limits, encashment eligibility, probation leave restrictions,
                and negative balance thresholds.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 hover:underline"
          >
            <span>Hide Help</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold shadow-sm transition ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sun className="h-4 w-4 text-blue-600" />
          <span>Annual Leave Scheme Configuration</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Leave Year Start Month
            </label>
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value={1}>January (Calendar Year)</option>
              <option value={4}>April (Financial Year)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Maximum Carry Forward (Days)
            </label>
            <input
              type="number"
              value={maxCarry}
              onChange={(e) => setMaxCarry(Number(e.target.value))}
              disabled={!carryForward}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={carryForward}
                onChange={(e) => setCarryForward(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Enable Earned/Privilege Leave Carry Forward to Next Year
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={encashment}
                onChange={(e) => setEncashment(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Allow Leave Encashment on Annual Settlement / Separation
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={probationLeave}
                onChange={(e) => setProbationLeave(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Allow Availing Paid Leaves During Probation Period</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={negativeBalance}
                onChange={(e) => setNegativeBalance(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Permit Negative Leave Balance (Advance Leaves)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Leave Options"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
