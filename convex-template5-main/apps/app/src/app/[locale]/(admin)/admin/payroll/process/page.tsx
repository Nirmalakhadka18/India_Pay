"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Info,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PayrollHeader } from "../payroll-header";

export default function ProcessPayrollPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [helpOpen, setHelpOpen] = useState(true);
  const [tasks, setTasks] = useState([
    { id: "lock", label: "Lock Previous Payroll", completed: true },
    { id: "additions", label: "Employee Additions", completed: true },
    { id: "separations", label: "Employee Separations", completed: true },
    { id: "confirmations", label: "Employee Confirmations", completed: false },
    { id: "updates", label: "Employee Data Updates", completed: false },
  ]);

  const [processingState, setProcessingState] = useState<
    "ready" | "processing" | "completed"
  >("ready");

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const handleReset = () => {
    setTasks(tasks.map((t) => ({ ...t, completed: false })));
  };

  const handleProcess = () => {
    setProcessingState("processing");
    setTimeout(() => {
      setProcessingState("completed");
    }, 2000);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F7F7F7] text-[#394657] font-sans antialiased text-[14px]">
      <PayrollHeader currentTab="process" />

      <main className="flex-1 w-full p-6 space-y-6 max-w-[1920px] mx-auto">
        {/* Help Banner Container matching greytHR */}
        {helpOpen && (
          <div className="relative rounded bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-[13px] leading-relaxed text-[#5A6A7C] shadow-2xs">
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="absolute top-4 right-4 text-xs font-semibold text-[#3E5ECC] hover:underline"
            >
              Hide Help
            </button>
            <p>
              The <strong className="text-slate-800">Payroll Process</strong>{" "}
              page helps you to process the payroll with the help of the
              provided checklist. The Checklist provided indicates the tasks
              that you need to complete to process the payroll. The order in
              which they appear is a suggested order in which you can complete
              the tasks.
            </p>
            <p className="mt-1">
              Once all the items are marked as completed, click the{" "}
              <strong className="text-slate-800">Process Payroll</strong> button
              to complete the processing activity.
            </p>
            <p className="mt-2 text-xs">
              Explore greytHR by{" "}
              <a href="#help-doc" className="text-[#3E5ECC] hover:underline">
                Help-Doc
              </a>
              , watching{" "}
              <a href="#videos" className="text-[#3E5ECC] hover:underline">
                How-to Videos
              </a>{" "}
              and{" "}
              <a href="#faq" className="text-[#3E5ECC] hover:underline">
                FAQ
              </a>
              .
            </p>
          </div>
        )}

        {/* 2-Column Checklist Container matching greytHR reference */}
        <div className="rounded-lg border border-[#E4E9F0] bg-white p-6 shadow-xs min-h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Checklist */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#394657]">Checklist</h3>

              <div className="space-y-3">
                {tasks
                  .filter((t) => !t.completed)
                  .map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-3 cursor-pointer text-xs text-slate-800 hover:text-slate-900 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggleTask(t.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#3E5ECC] focus:ring-[#3E5ECC]"
                      />
                      <span>{t.label}</span>
                    </label>
                  ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="text-xs text-[#3E5ECC] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  more ↓
                </button>
              </div>
            </div>

            {/* Right Column: Completed Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#394657]">
                  Completed Tasks
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50 transition shadow-2xs font-medium"
                >
                  Reset
                </button>
              </div>

              {completedCount === 0 ? (
                <div className="text-xs text-slate-400 italic pt-2">
                  (Feeling empty. Tick off some items &amp; make my day...)
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {tasks
                    .filter((t) => t.completed)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="line-through text-slate-400">
                            {t.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleTask(t.id)}
                          className="text-[11px] text-[#3E5ECC] hover:underline"
                        >
                          Undo
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Strip at bottom */}
          <div className="mt-12 flex items-center gap-3 border-t border-[#F0F2F5] pt-6">
            <button
              type="button"
              onClick={handleProcess}
              disabled={processingState === "processing"}
              className="flex items-center gap-2 rounded bg-[#3557CA] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2E4AA3] transition disabled:opacity-50"
            >
              {processingState === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing November 2026 Payroll...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Process Payroll
                </>
              )}
            </button>
            <Link
              href="/admin/payroll"
              className="rounded border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              Cancel
            </Link>

            {processingState === "completed" && (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold pl-3">
                <CheckCircle2 className="h-4 w-4" />
                Payroll Computation Completed Successfully (33 Employees)!
              </span>
            )}
          </div>
        </div>
      </main>

      {/* Floating What's New Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full bg-[#9333EA] px-4 py-2 text-xs font-semibold text-white shadow-lg hover:bg-[#7E22CE] transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          What&apos;s New!
        </button>
      </div>
    </div>
  );
}
