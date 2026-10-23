"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  Info,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function WorklifePage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const resignation = useQuery(api.resignation.getMyResignation, scoped);

  const submitResignation = useMutation(api.resignation.submitResignation);
  const withdrawResignation = useMutation(api.resignation.withdrawResignation);

  // Resignation Form State
  const [proposedDate, setProposedDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [resignationReason, setResignationReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Auto-calculated expected Last Working Day
  const expectedLWD = useMemo(() => {
    if (!proposedDate) return "—";
    const d = new Date(proposedDate);
    if (Number.isNaN(d.getTime())) return "—";
    d.setDate(d.getDate() + Number(noticePeriodDays || 0));
    return d.toISOString().slice(0, 10);
  }, [proposedDate, noticePeriodDays]);

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!proposedDate) {
      setSubmitError("Please select a proposed resignation date.");
      return;
    }

    if (noticePeriodDays < 0 || noticePeriodDays > 180) {
      setSubmitError("Notice period must be between 0 and 180 days.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResignation({
        workspaceId,
        proposedResignationDate: proposedDate,
        noticePeriodDays: Number(noticePeriodDays),
        reason: resignationReason.trim() || undefined,
      });
      setSubmitSuccess(
        "Resignation request submitted. It will be reviewed by Human Resources.",
      );
      setResignationReason("");
    } catch (err) {
      setSubmitError(
        (err as Error).message || "Failed to submit resignation request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawResignation = async () => {
    if (!workspaceId || !resignation) return;
    if (
      !confirm(
        "Are you sure you want to withdraw your pending resignation request?",
      )
    ) {
      return;
    }

    setIsWithdrawing(true);
    try {
      await withdrawResignation({
        workspaceId,
        resignationId: resignation._id,
      });
      alert("Resignation request withdrawn successfully.");
    } catch (err) {
      alert(
        (err as Error).message || "Failed to withdraw resignation request.",
      );
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  if (me === undefined) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-primary/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="p-8 text-center text-sm text-primary/60">
        No employee record linked to your user account.
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-blue-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                My Worklife
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Your comprehensive employment profile, job role, reporting relationship, and resignation management.
            </p>
          </div>

          <Link href="/people">
            <Button variant="outline" size="sm" className="text-xs">
              <Users className="mr-1.5 h-3.5 w-3.5" /> View People Directory
            </Button>
          </Link>
        </div>

        {/* Profile Card & Employment Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal Identity */}
          <div className="col-span-1 rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-primary truncate">
                  {me.firstName} {me.lastName}
                </h2>
                <p className="text-xs text-primary/60 truncate">
                  {me.designation || "Staff Member"}
                </p>
                <p className="font-mono text-xs text-primary/50 mt-0.5">
                  #{("employeeIdNumber" in me && typeof me.employeeIdNumber === "string" ? me.employeeIdNumber : me._id.slice(-6).toUpperCase())}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Work Email
                </p>
                <p className="font-medium text-primary mt-0.5">{me.email}</p>
              </div>

              <div>
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Work Phone
                </p>
                <p className="font-medium text-primary mt-0.5">{me.phone || "—"}</p>
              </div>

              <div>
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Location & Branch
                </p>
                <p className="font-medium text-primary mt-0.5">
                  Bangalore Head Office, India
                </p>
              </div>

              <div>
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Employment Status
                </p>
                <span className="mt-1 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 capitalize">
                  {me.status}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Employment Details & Reporting Structure */}
          <div className="col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-base font-semibold text-primary">
                Employment & Role Details
              </h3>
              <p className="text-xs text-primary/60">
                Organizational placement and manager alignment.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Department
                </p>
                <p className="font-semibold text-primary text-sm">
                  {me.department || "General Operations"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Designation / Role
                </p>
                <p className="font-semibold text-primary text-sm">
                  {me.designation || "Staff Member"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Joining Date
                </p>
                <p className="font-medium text-primary">
                  {"joiningDate" in me && typeof me.joiningDate === "string"
                    ? new Date(me.joiningDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })
                    : "01 Sep, 2026"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Reporting Manager
                </p>
                <p className="font-medium text-primary">
                  Workspace Administrator (HR & Admin)
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Probation / Confirmation Status
                </p>
                <p className="font-medium text-primary">Confirmed Regular Employee</p>
              </div>

              <div className="space-y-1">
                <p className="text-primary/50 uppercase tracking-wider font-semibold text-[10px]">
                  Standard Notice Period
                </p>
                <p className="font-medium text-primary">30 Calendar Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RESIGNATION & NOTICE PERIOD WORKFLOW (PROMPT SPECIFIED) ───────── */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-semibold text-primary">
                  Resignation & Notice Period Management
                </h3>
              </div>
              <p className="text-xs text-primary/60 mt-0.5">
                Submit formal resignation, track expected vs approved Last Working Day (LWD), and manage exit workflow.
              </p>
            </div>

            {resignation && (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                  resignation.status === "approved"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : resignation.status === "rejected"
                      ? "bg-red-500/10 text-red-600 dark:text-red-400"
                      : resignation.status === "withdrawn"
                        ? "bg-muted text-muted-foreground"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                Status: {resignation.status}
              </span>
            )}
          </div>

          {resignation ? (
            /* Active Resignation Record Card */
            <div className="rounded-md border border-border/80 bg-muted/20 p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-primary/50">Proposed Resignation Date</p>
                  <p className="font-semibold text-primary mt-0.5 font-mono">
                    {resignation.proposedResignationDate}
                  </p>
                </div>
                <div>
                  <p className="text-primary/50">Notice Period</p>
                  <p className="font-semibold text-primary mt-0.5 font-mono">
                    {resignation.noticePeriodDays} Days
                  </p>
                </div>
                <div>
                  <p className="text-primary/50">Expected Last Working Day</p>
                  <p className="font-semibold text-primary mt-0.5 font-mono">
                    {resignation.expectedLastWorkingDay}
                  </p>
                </div>
                <div>
                  <p className="text-primary/50">Approved Last Working Day</p>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    {resignation.approvedLastWorkingDay || "Awaiting HR approval"}
                  </p>
                </div>
              </div>

              {resignation.reason && (
                <div className="text-xs">
                  <p className="text-primary/50">Resignation Reason:</p>
                  <p className="text-primary/80 italic mt-0.5">
                    &quot;{resignation.reason}&quot;
                  </p>
                </div>
              )}

              {resignation.hrComments && (
                <div className="rounded bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400">
                  <p className="font-semibold">HR Review Comments:</p>
                  <p className="mt-0.5">{resignation.hrComments}</p>
                </div>
              )}

              {resignation.status === "pending" && (
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <p className="text-xs text-primary/60">
                    Your resignation is currently pending HR review. You may withdraw it before authorization.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isWithdrawing}
                    onClick={handleWithdrawResignation}
                    className="text-destructive hover:bg-destructive/10 text-xs"
                  >
                    {isWithdrawing ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      "Withdraw Resignation"
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            /* Resignation Submission Form */
            <form onSubmit={handleSubmitResignation} className="space-y-5 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Proposed Resignation Date <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={proposedDate}
                    onChange={(e) => setProposedDate(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Notice Period (Days) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    required
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Calculated Expected Last Working Day */}
              <div className="rounded-md border border-border/80 bg-muted/40 p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-primary">
                    Calculated Expected Last Working Day (LWD)
                  </p>
                  <p className="text-[11px] text-primary/50">
                    Based on proposed date + notice period days
                  </p>
                </div>
                <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                  {expectedLWD}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Reason for Resignation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  placeholder="Personal reasons, career advancement, relocation, etc..."
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

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit Resignation Request"
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-primary/50">
                Notice: Submitting a resignation request does not immediately terminate your employment or alter payroll. An authorized HR administrator will review and confirm your Last Working Day.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
