"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Power,
  Share2,
  ShieldCheck,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function IntegrationsSettingsPage() {
  const [showHelp, setShowHelp] = useState(true);
  const connectors = useQuery(api.systemSettings.getIntegrationConnectors);
  const toggleStatus = useMutation(api.systemSettings.toggleConnectorStatus);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleToggle = async (
    key: string,
    currentStatus: boolean,
    name: string,
  ) => {
    try {
      await toggleStatus({
        connectorKey: key,
        isEnabled: !currentStatus,
      });
      setFeedback({
        type: "success",
        text: `${name} ${!currentStatus ? "enabled" : "disabled"} successfully.`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to toggle connector",
      });
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
        <span className="text-slate-800 font-semibold">Integrations</span>
      </div>

      {showHelp && (
        <div className="relative flex items-start justify-between rounded-xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 shadow-sm transition">
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sky-950">
                Integration Connectors
              </p>
              <p className="text-sky-800 leading-relaxed">
                Connect your IndiaPay environment with external ERP, accounting,
                communication, and custom outgoing webhooks. All API tokens and
                secrets are securely encrypted server-side.
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

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connectors?.map((conn) => (
          <div
            key={conn.connectorKey}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Share2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {conn.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {conn.category}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  conn.status === "CONNECTED"
                    ? "bg-emerald-100 text-emerald-800"
                    : conn.status === "CONFIGURED"
                      ? "bg-blue-100 text-blue-800"
                      : conn.status === "DEMO"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                }`}
              >
                {conn.status}
              </span>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50/60 p-3 rounded-lg border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">API Version:</span>
                <span className="font-semibold text-slate-800">
                  {conn.apiVersion || "v1"}
                </span>
              </div>
              {conn.webhookUrl && (
                <div className="flex justify-between truncate">
                  <span className="text-slate-400 font-medium">Endpoint:</span>
                  <span className="font-semibold text-slate-800 truncate ml-2">
                    {conn.webhookUrl}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-500">
                {conn.isEnabled ? "Active & Listening" : "Disabled"}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleToggle(conn.connectorKey, conn.isEnabled, conn.name)
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  conn.isEnabled
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                <span>{conn.isEnabled ? "Disconnect" : "Connect"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
