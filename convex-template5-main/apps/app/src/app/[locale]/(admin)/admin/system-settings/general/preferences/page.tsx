"use client";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Save,
  Shield,
  Sliders,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function GeneralPreferencesPage() {
  const [showHelp, setShowHelp] = useState(true);
  const [financialYear, setFinancialYear] = useState("April to March");
  const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");
  const [enableAudit, setEnableAudit] = useState(true);
  const [multiCurrency, setMultiCurrency] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
        <span className="text-slate-800 font-semibold">General Options</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">General Options</p>
              <p className="text-sky-800 leading-relaxed">
                Configure enterprise-wide date formatting, financial year start
                cycles, audit logging parameters, and multi-currency operations.
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

      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 shadow-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>General preferences saved successfully.</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
      >
        <h2 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">
          Enterprise Preferences
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Financial Year Cycle
            </label>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="April to March">
                April to March (Standard India)
              </option>
              <option value="January to December">
                January to December (Calendar Year)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Display Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
            >
              <option value="DD-MM-YYYY">DD-MM-YYYY (e.g. 18-11-2026)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-18)</option>
            </select>
          </div>

          <div className="md:col-span-2 space-y-3 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={enableAudit}
                onChange={(e) => setEnableAudit(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Full System Audit Trail Logging</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-slate-700">
              <input
                type="checkbox"
                checked={multiCurrency}
                onChange={(e) => setMultiCurrency(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Enable Multi-Currency Support</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}
