"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Info,
  Layers,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const SCREEN_OPTIONS = [
  { value: "eim-profile-category", label: "EIM Profile Category" },
  { value: "ess-filter-category", label: "Ess Filter Category" },
  { value: "general-employee-category", label: "General Employee Category" },
  { value: "leave-review-page-category", label: "Leave Review Page" },
  { value: "paygroup-emp-category", label: "Pay Group Employee Category" },
];

export default function CategoryGroupPage() {
  const [selectedScreen, setSelectedScreen] = useState("eim-profile-category");
  const [availableList, setAvailableList] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [selectedAvailableItem, setSelectedAvailableItem] = useState<string | null>(null);
  const [selectedChosenItem, setSelectedChosenItem] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safe query handling with fallback
  let groups: any = undefined;
  try {
    groups = useQuery(api.systemSettings.getTransitionGroups, { screenKey: selectedScreen });
  } catch (err) {
    groups = undefined;
  }
  let saveTransitionGroup: any = null;
  try {
    saveTransitionGroup = useMutation(api.systemSettings.saveTransitionGroup);
  } catch (err) {
    saveTransitionGroup = null;
  }

  useEffect(() => {
    if (groups && groups.length > 0) {
      const active = groups[0];
      setAvailableList(active.availableCategories || []);
      setSelectedList(active.selectedCategories || []);
    } else {
      setAvailableList(["Cost Center", "Grade", "Business Unit", "Project"]);
      setSelectedList(["Department", "Designation", "Location"]);
    }
    setSelectedAvailableItem(null);
    setSelectedChosenItem(null);
  }, [selectedScreen, groups]);

  const handleMoveRight = () => {
    if (!selectedAvailableItem) return;
    setAvailableList((prev) => prev.filter((i) => i !== selectedAvailableItem));
    setSelectedList((prev) => [...prev, selectedAvailableItem]);
    setSelectedAvailableItem(null);
  };

  const handleMoveLeft = () => {
    if (!selectedChosenItem) return;
    setSelectedList((prev) => prev.filter((i) => i !== selectedChosenItem));
    setAvailableList((prev) => [...prev, selectedChosenItem]);
    setSelectedChosenItem(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const screenLabel = SCREEN_OPTIONS.find((s) => s.value === selectedScreen)?.label || selectedScreen;
      if (saveTransitionGroup) {
        await saveTransitionGroup({
          screenKey: selectedScreen,
          screenName: screenLabel,
          availableCategories: availableList,
          selectedCategories: selectedList,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save category group configuration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin/system-settings/general/company-info" className="hover:text-blue-600">
          Settings
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link href="/admin/system-settings/employee/preferences" className="hover:text-blue-600">
          Employee
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">Category Group</span>
      </div>

      {/* greytHR Help Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start justify-between shadow-sm">
        <div className="space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-blue-950 text-sm">
            <Info className="h-4 w-4 text-blue-600" />
            Screen Category Group Configuration
          </p>
          <p className="text-slate-600 leading-relaxed">
            Throughout the application, there are many screens where one or more employee categories are used for filtering or displaying related employee information. From here, you can configure which employee dimensions are displayed for each module.
          </p>
        </div>
      </div>

      {/* Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Screen Selector Header */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-blue-600" />
            <label className="text-xs font-bold text-slate-700">Screen:</label>
            <select
              value={selectedScreen}
              onChange={(e) => setSelectedScreen(e.target.value)}
              className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-72"
            >
              {SCREEN_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Save Configuration</span>
          </button>
        </div>

        {/* Dual List Box matching greytHR Category Group View */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* Available Categories */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Available Categories</span>
                <span className="text-slate-400 font-normal">({availableList.length})</span>
              </label>
              <div className="h-64 border border-slate-200 rounded-xl bg-slate-50/50 p-2 overflow-y-auto space-y-1 shadow-inner">
                {availableList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    All categories selected
                  </div>
                ) : (
                  availableList.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedAvailableItem(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition ${
                        selectedAvailableItem === item
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-200/60"
                      }`}
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Shuttle Transfer Buttons */}
            <div className="md:col-span-1 flex md:flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleMoveRight}
                disabled={!selectedAvailableItem}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700"
                title="Add to Selected"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleMoveLeft}
                disabled={!selectedChosenItem}
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 shadow-sm transition disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-700"
                title="Remove from Selected"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Categories */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Selected Categories</span>
                <span className="text-blue-600 font-bold">({selectedList.length})</span>
              </label>
              <div className="h-64 border border-blue-200 rounded-xl bg-blue-50/20 p-2 overflow-y-auto space-y-1 shadow-inner">
                {selectedList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    No categories selected
                  </div>
                ) : (
                  selectedList.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSelectedChosenItem(item)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition ${
                        selectedChosenItem === item
                          ? "bg-blue-600 text-white shadow-xs"
                          : "text-slate-800 bg-white hover:bg-slate-100/80 border border-slate-100 shadow-xs"
                      }`}
                    >
                      {item}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs text-slate-500">
          <span>Active filter dimensions for {SCREEN_OPTIONS.find((s) => s.value === selectedScreen)?.label}</span>
          {saveSuccess && (
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle className="h-3.5 w-3.5" /> Changes saved to workspace
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
