"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  Check,
  CheckSquare,
  Info,
  Loader2,
  Shield,
  Square,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NewFeaturesSettingsPage() {
  const [showHelp, setShowHelp] = useState(true);
  const [filterMode, setFilterMode] = useState<
    "all" | "selected" | "unselected"
  >("all");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);

  const features = useQuery(api.accountSettings.getAccountFeatures);
  const toggleFeature = useMutation(api.accountSettings.toggleAccountFeature);

  const allFeatures = features || [];
  const selectedCount = allFeatures.filter((f) => f.enabled).length;
  const totalCount = allFeatures.length;

  const filteredFeatures = allFeatures.filter((f) => {
    if (filterMode === "selected") return f.enabled;
    if (filterMode === "unselected") return !f.enabled;
    return true;
  });

  const handleToggle = async (featureKey: string, currentStatus: boolean) => {
    setUpdatingKey(featureKey);
    try {
      await toggleFeature({ featureKey, enabled: !currentStatus });
    } catch (err) {
      console.error("Failed to toggle feature:", err);
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb matching greytHR */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/admin" className="hover:text-slate-700">
          Home
        </Link>
        <span className="text-slate-400">&gt;</span>
        <span className="text-slate-800">New Features</span>
      </div>

      {/* Help Banner matching greytHR */}
      {showHelp && (
        <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              This page lists all the features that have been enabled in the
              software. Explore greytHR by{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                Help-Doc
              </span>
              , watching{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                How-to Videos
              </span>{" "}
              and{" "}
              <span className="text-blue-600 font-semibold cursor-pointer hover:underline">
                FAQ
              </span>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="font-semibold text-slate-500 hover:text-slate-800"
          >
            Hide Help
          </button>
        </div>
      )}

      {/* Feature Selection Filter Header matching greytHR: "16 of 25 features selected" */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="text-xs font-bold text-slate-900">
          {features === undefined ? (
            <span className="text-slate-400">Loading features...</span>
          ) : (
            <span>
              {selectedCount} of {totalCount} features selected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`hover:text-blue-600 transition ${
              filterMode === "all" ? "text-blue-600 font-bold underline" : ""
            }`}
          >
            Show All
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setFilterMode("selected")}
            className={`hover:text-blue-600 transition ${
              filterMode === "selected"
                ? "text-blue-600 font-bold underline"
                : ""
            }`}
          >
            Show Selected
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setFilterMode("unselected")}
            className={`hover:text-blue-600 transition ${
              filterMode === "unselected"
                ? "text-blue-600 font-bold underline"
                : ""
            }`}
          >
            Show Unselected
          </button>
        </div>
      </div>

      {/* Features List matching greytHR rows */}
      <div className="space-y-3">
        {features === undefined ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            Loading registry features...
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
            No features match the selected filter.
          </div>
        ) : (
          filteredFeatures.map((feat) => {
            const isUpdating = updatingKey === feat.featureKey;
            return (
              <div
                key={feat.featureKey}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        handleToggle(feat.featureKey, feat.enabled)
                      }
                      className="mt-0.5 text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      ) : feat.enabled ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-slate-400" />
                      )}
                    </button>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {feat.name}
                      </h4>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                        {feat.enabled ? (
                          <span className="font-semibold text-emerald-700 flex items-center gap-1">
                            <span>
                              You enabled this feature{" "}
                              {feat.enabledAt ? `on ${feat.enabledAt}` : ""}
                            </span>
                            <span className="text-slate-300">|</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggle(feat.featureKey, true)
                              }
                              className="text-red-600 hover:underline font-bold"
                            >
                              Disable
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggle(feat.featureKey, false)}
                            className="text-blue-600 hover:underline font-bold"
                          >
                            Enable this feature
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap self-start">
                    {feat.since}
                  </span>
                </div>

                <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
