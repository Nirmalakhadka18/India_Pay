"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  GitFork,
  Info,
  Loader2,
  PlusCircle,
  ShieldAlert,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

export default function DelegatesPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const delegates = useQuery(api.delegates.getMyDelegates, scoped);
  const employees = useQuery(api.employees.list, scoped);

  const setDelegate = useMutation(api.delegates.setDelegate);
  const deactivateDelegate = useMutation(api.delegates.deactivateDelegate);

  const [targetEmpId, setTargetEmpId] = useState<string>("");
  const [workflowType, setWorkflowType] = useState<
    "leave_approvals" | "attendance_approvals" | "all"
  >("leave_approvals");
  const [startDate, setStartDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const handleSetDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!targetEmpId) {
      setSubmitError("Please select a colleague to delegate workflows to.");
      return;
    }

    if (startDate > endDate) {
      setSubmitError("Start date cannot be after end date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await setDelegate({
        workspaceId,
        delegateEmployeeId: targetEmpId as Id<"employees">,
        workflowType,
        startDate,
        endDate,
        notes: notes.trim() || undefined,
      });
      setSubmitSuccess("Workflow delegate assigned successfully.");
      setNotes("");
    } catch (err) {
      setSubmitError((err as Error).message || "Failed to assign delegate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (delegateId: Id<"workflowDelegates">) => {
    if (!workspaceId) return;
    try {
      await deactivateDelegate({ workspaceId, delegateId });
    } catch (err) {
      alert((err as Error).message || "Failed to deactivate delegate.");
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  // Filter out myself from delegate choices
  const eligiblePeers = employees?.filter((e) => !me || e._id !== me._id) ?? [];

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-rose-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                Workflow Delegates
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Assign a temporary peer delegate to act on operational leave
              approvals or attendance reviews during your absence.
            </p>
          </div>
        </div>

        {/* Security & Access Restriction Notice */}
        <div className="rounded-md border border-amber-300/40 bg-amber-50/60 p-4 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              <strong>Compliance Rule:</strong> Workflow delegation is
              restricted exclusively to peer operational tasks (leave
              authorizations and team attendance approvals). Employees are
              strictly prohibited from delegating statutory payroll calculations
              or administrative credentials.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-5 rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-primary">
              Assign New Workflow Delegate
            </h2>

            <form onSubmit={handleSetDelegate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Select Colleague Delegate{" "}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={targetEmpId}
                  onChange={(e) => setTargetEmpId(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Choose a team member...</option>
                  {eligiblePeers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.firstName} {p.lastName} ({p.department || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Workflow Authorization{" "}
                  <span className="text-destructive">*</span>
                </label>
                <select
                  value={workflowType}
                  onChange={(e) =>
                    setWorkflowType(
                      e.target.value as
                        | "leave_approvals"
                        | "attendance_approvals"
                        | "all",
                    )
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="leave_approvals">Leave Approvals Only</option>
                  <option value="attendance_approvals">
                    Attendance Approvals Only
                  </option>
                  <option value="all">All Operational Approvals</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Start Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    End Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Handover Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delegation instructions for planned vacation / out of office..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-500">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Confirm Delegation"
                )}
              </Button>
            </form>
          </div>

          {/* List of Active / Past Delegations */}
          <div className="lg:col-span-7 rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold text-primary">
                Assigned Delegations
              </h2>
              <p className="text-xs text-primary/60">
                Active and historical workflow handovers configured by you.
              </p>
            </div>

            {delegates === undefined ? (
              <div className="flex h-48 items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : delegates.length === 0 ? (
              <div className="p-12 text-center text-sm text-primary/50">
                No active delegates configured.
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Delegate</th>
                    <th className="px-6 py-3 font-medium">Scope</th>
                    <th className="px-6 py-3 font-medium">Period</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {delegates.map((d) => (
                    <tr key={d._id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-xs text-primary">
                          {d.delegateName}
                        </p>
                        <p className="text-[10px] text-primary/50 font-mono">
                          #{d.delegateEmpId || "EMP"}
                        </p>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary/70 capitalize">
                        {d.workflowType.replace("_", " ")}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary/70 font-mono">
                        {d.startDate} to {d.endDate}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            d.status === "active"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {d.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivate(d._id)}
                            className="text-xs text-destructive hover:bg-destructive/10"
                          >
                            Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
