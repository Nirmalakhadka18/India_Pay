"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Hash,
  HelpCircle,
  Save,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function EmployeePreferencesPage() {
  const [showHelp, setShowHelp] = useState(true);
  const data = useQuery(api.systemSettings.getEmployeePreferences);
  const updateSettings = useMutation(
    api.systemSettings.updateEmployeePreferences,
  );

  const [autoGen, setAutoGen] = useState(true);
  const [prefix, setPrefix] = useState("IND");
  const [startNum, setStartNum] = useState(1001);
  const [length, setLength] = useState(4);
  const [probation, setProbation] = useState(6);
  const [notice, setNotice] = useState(60);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      setAutoGen(data.empNoAutoGenerate ?? true);
      setPrefix(data.empNoPrefix || "IND");
      setStartNum(data.empNoStartingNumber || 1001);
      setLength(data.empNoLength || 4);
      setProbation(data.probationPeriodMonths || 6);
      setNotice(data.noticePeriodDays || 60);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({
        empNoAutoGenerate: autoGen,
        empNoPrefix: prefix,
        empNoStartingNumber: Number(startNum),
        empNoLength: Number(length),
        probationPeriodMonths: Number(probation),
        noticePeriodDays: Number(notice),
      });
      setFeedback({
        type: "success",
        text: "Employee options updated successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update employee options",
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
        <span className="text-slate-800 font-semibold">Employee Options</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">
                Employee Options &amp; Series
              </p>
              <p className="text-sky-800 leading-relaxed">
                Configure employee numbering sequence logic, automated prefixes,
                probation period durations, and separation notice periods.
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
          <Users className="h-4 w-4 text-blue-600" />
          <span>Employee Numbering &amp; Tenure Rules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={autoGen}
                onChange={(e) => setAutoGen(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Automatically Generate Employee Numbers on Creation</span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Employee ID Prefix
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={!autoGen}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Starting Sequence Number
            </label>
            <input
              type="number"
              value={startNum}
              onChange={(e) => setStartNum(Number(e.target.value))}
              disabled={!autoGen}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Standard Probation Period (Months)
            </label>
            <input
              type="number"
              value={probation}
              onChange={(e) => setProbation(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notice Period (Days)
            </label>
            <input
              type="number"
              value={notice}
              onChange={(e) => setNotice(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Options"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
