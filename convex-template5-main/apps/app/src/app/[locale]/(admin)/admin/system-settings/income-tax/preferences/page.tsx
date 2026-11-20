"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  HelpCircle,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function IncomeTaxPreferencesPage() {
  const [showHelp, setShowHelp] = useState(true);
  const data = useQuery(api.systemSettings.getIncomeTaxPreferences);
  const updateSettings = useMutation(
    api.systemSettings.updateIncomeTaxPreferences,
  );

  const [fy, setFy] = useState("2026-2027");
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [allowSwitch, setAllowSwitch] = useState(true);
  const [windowOpen, setWindowOpen] = useState(true);
  const [deadline, setDeadline] = useState("2027-01-31");
  const [panRequired, setPanRequired] = useState(true);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (data) {
      setFy(data.activeFinancialYear || "2026-2027");
      setRegime(data.defaultTaxRegime || "new");
      setAllowSwitch(data.allowRegimeSwitch ?? true);
      setWindowOpen(data.declarationWindowOpen ?? true);
      setDeadline(data.proofSubmissionDeadline || "2027-01-31");
      setPanRequired(data.panValidationRequired ?? true);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateSettings({
        activeFinancialYear: fy,
        defaultTaxRegime: regime,
        allowRegimeSwitch: allowSwitch,
        declarationWindowOpen: windowOpen,
        proofSubmissionDeadline: deadline,
        panValidationRequired: panRequired,
      });
      setFeedback({
        type: "success",
        text: "Income tax parameters updated successfully.",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to update tax parameters",
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
        <span className="text-slate-800 font-semibold">Income Tax Options</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">
                Income Tax &amp; TDS Options
              </p>
              <p className="text-sky-800 leading-relaxed">
                Configure active financial year TDS calculations, default tax
                regimes (New 115BAC vs Old), declaration window windows, and
                proof submission cutoff deadlines.
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
          <FileText className="h-4 w-4 text-blue-600" />
          <span>Statutory Tax &amp; Declarations Setup</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Active Assessment / Financial Year
            </label>
            <select
              value={fy}
              onChange={(e) => setFy(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="2026-2027">FY 2026-2027 (AY 2027-2028)</option>
              <option value="2025-2026">FY 2025-2026 (AY 2026-2027)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Default Enterprise Tax Regime
            </label>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value as "new" | "old")}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="new">
                New Tax Regime (Section 115BAC Default)
              </option>
              <option value="old">
                Old Tax Regime (With Chapter VI-A Exemptions)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Proof of Investment Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={allowSwitch}
                onChange={(e) => setAllowSwitch(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Allow Employees to Switch Regimes During Declaration Window
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={windowOpen}
                onChange={(e) => setWindowOpen(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Open Investment Declaration Window for Current Financial Year
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={panRequired}
                onChange={(e) => setPanRequired(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Mandatory PAN Validation for Higher Rate (20%) TDS Prevention
              </span>
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
            <span>{saving ? "Saving..." : "Save Tax Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
