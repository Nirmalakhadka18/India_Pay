"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Percent,
  Save,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PayrollPreferencesPage() {
  const [showHelp, setShowHelp] = useState(true);
  const data = useQuery(api.systemSettings.getPayrollPreferences);
  const updateSettings = useMutation(
    api.systemSettings.updatePayrollPreferences,
  );

  const [payCycle, setPayCycle] = useState("1-to-last");
  const [payDay, setPayDay] = useState(30);
  const [roundOff, setRoundOff] = useState(true);
  const [pfLimit, setPfLimit] = useState(15000);
  const [esiLimit, setEsiLimit] = useState(21000);
  const [ptApplicable, setPtApplicable] = useState(true);
  const [lwf, setLwf] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      setPayCycle(data.payPeriodCycle || "1-to-last");
      setPayDay(data.payDay || 30);
      setRoundOff(data.roundOffSalary ?? true);
      setPfLimit(data.pfCeilingLimit || 15000);
      setEsiLimit(data.esiCeilingLimit || 21000);
      setPtApplicable(data.ptApplicable ?? true);
      setLwf(data.labourWelfareFund ?? true);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({
        payPeriodCycle: payCycle,
        payDay: Number(payDay),
        roundOffSalary: roundOff,
        pfCeilingLimit: Number(pfLimit),
        esiCeilingLimit: Number(esiLimit),
        ptApplicable,
        labourWelfareFund: lwf,
      });
      setFeedback({
        type: "success",
        text: "Payroll statutory options updated successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update payroll options",
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
        <span className="text-slate-800 font-semibold">Payroll Options</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">
                Payroll &amp; Statutory Settings
              </p>
              <p className="text-sky-800 leading-relaxed">
                Configure pay cycle cutoff days, disbursement scheduling,
                Provident Fund ceiling thresholds, ESI eligibility limits, and
                statutory welfare compliance flags.
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
          <CreditCard className="h-4 w-4 text-blue-600" />
          <span>Pay Period &amp; Statutory Parameters</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Pay Period Cycle
            </label>
            <select
              value={payCycle}
              onChange={(e) => setPayCycle(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="1-to-last">1st of Month to End of Month</option>
              <option value="26-to-25">
                26th of Previous Month to 25th of Current Month
              </option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Disbursement Pay Day
            </label>
            <input
              type="number"
              value={payDay}
              onChange={(e) => setPayDay(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              PF Statutory Wage Ceiling (₹)
            </label>
            <input
              type="number"
              value={pfLimit}
              onChange={(e) => setPfLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ESI Statutory Wage Ceiling (₹)
            </label>
            <input
              type="number"
              value={esiLimit}
              onChange={(e) => setEsiLimit(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={roundOff}
                onChange={(e) => setRoundOff(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Round off net salary calculation to nearest Rupee</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={ptApplicable}
                onChange={(e) => setPtApplicable(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Deduct Professional Tax (PT) according to state location slabs
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={lwf}
                onChange={(e) => setLwf(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Labour Welfare Fund (LWF) statutory deduction</span>
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
            <span>{saving ? "Saving..." : "Save Payroll Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
