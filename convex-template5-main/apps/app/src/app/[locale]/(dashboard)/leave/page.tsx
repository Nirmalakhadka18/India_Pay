"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Info,
  Loader2,
  Paperclip,
  PlusCircle,
  ShieldCheck,
  UploadCloud,
  User,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type TabKey =
  | "apply"
  | "balances"
  | "calendar"
  | "holidays"
  | "requests"
  | "restricted";

function AttachmentDownloadLink({
  workspaceId,
  storageId,
  fileName,
}: {
  workspaceId: Id<"workspaces">;
  storageId: Id<"_storage">;
  fileName: string;
}) {
  const url = useQuery(api.leaves.getAttachmentUrl, {
    workspaceId,
    storageId,
  });

  if (!url) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-primary/80">
        <Paperclip className="h-3 w-3 text-cyan-600" />
        <span className="truncate max-w-[120px]">{fileName}</span>
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={fileName}
      className="inline-flex items-center gap-1 rounded bg-muted hover:bg-muted/80 px-2 py-0.5 text-[11px] font-mono text-cyan-600 dark:text-cyan-400 hover:underline transition"
      title={`Download ${fileName}`}
    >
      <Paperclip className="h-3 w-3" />
      <span className="truncate max-w-[120px]">{fileName}</span>
    </a>
  );
}

export default function LeavePage() {
  const { current: workspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<TabKey>("apply");

  const scoped = workspaceId ? { workspaceId } : "skip";
  const me = useQuery(api.employees.getMyProfile, scoped);
  const balances = useQuery(api.leaves.getLeaveBalances, scoped);
  const myLeaves = useQuery(api.leaves.getMyLeaves, scoped);
  const holidays = useQuery(api.leaves.getHolidays, scoped);

  const submitMyLeave = useMutation(api.leaves.submitMyLeave);
  const cancelMyLeave = useMutation(api.leaves.cancelMyLeave);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const submitCompOff = useMutation(api.leaves.submitCompOffRequest);
  const myCompOffRequests = useQuery(api.leaves.listMyCompOffRequests, scoped);

  // Apply Form State
  const [leaveType, setLeaveType] = useState<
    "sick" | "unpaid" | "restricted_holiday" | "comp_off"
  >("sick");
  const [fromDate, setFromDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [fromSession, setFromSession] = useState<
    "full_day" | "session_1" | "session_2"
  >("session_1");
  const [toDate, setToDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [toSession, setToSession] = useState<
    "full_day" | "session_1" | "session_2"
  >("session_1");
  const [contactDetails, setContactDetails] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Attachment Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadedStorageId, setUploadedStorageId] = useState<Id<"_storage"> | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

  // Comp-Off Request State
  const [compOffWorkDate, setCompOffWorkDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10),
  );
  const [compOffDaysCount, setCompOffDaysCount] = useState<number>(1);
  const [compOffReason, setCompOffReason] = useState("");
  const [isSubmittingCompOff, setIsSubmittingCompOff] = useState(false);
  const [compOffError, setCompOffError] = useState<string | null>(null);
  const [compOffSuccess, setCompOffSuccess] = useState<string | null>(null);

  // Calendar State
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());

  // Handle File Selection and Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileUploadError("File size exceeds 5MB limit.");
      return;
    }

    const allowed = [
      "pdf", "xls", "xlsx", "doc", "docx", "txt", "ppt", "pptx", "gif", "jpg", "jpeg", "png",
    ];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowed.includes(ext)) {
      setFileUploadError(`Invalid format .${ext}. Allowed: ${allowed.join(", ")}`);
      return;
    }

    setFileUploadError(null);
    setSelectedFile(file);
    setIsUploadingFile(true);
    try {
      const uploadUrl = await generateUploadUrl({ workspaceId: workspaceId! });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      setUploadedStorageId(storageId as Id<"_storage">);
    } catch {
      setFileUploadError("Failed to upload file. Please try again.");
      setSelectedFile(null);
      setUploadedStorageId(null);
    } finally {
      setIsUploadingFile(false);
    }
  };

  // Calculate Days Count
  const calculatedDays = useMemo(() => {
    if (!fromDate || !toDate) return 0;
    if (fromDate > toDate) return 0;
    if (fromDate === toDate) {
      if (fromSession === "session_1" || fromSession === "session_2") {
        return 0.5;
      }
      return 1;
    }
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(0.5, diff);
  }, [fromDate, toDate, fromSession]);

  const currentAvailableBalance = useMemo(() => {
    if (!balances) return 0;
    if (leaveType === "sick") return balances.sick.balance;
    if (leaveType === "unpaid") return 999;
    if (leaveType === "restricted_holiday") return balances.restricted_holiday?.balance ?? 2;
    if (leaveType === "comp_off") return balances.comp_off?.balance ?? 0;
    return 0;
  }, [balances, leaveType]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitError(null);
    setSubmitSuccess(null);

    if (fromDate > toDate) {
      setSubmitError("From date cannot be after To date.");
      return;
    }

    if (!reason.trim()) {
      setSubmitError("Please enter a reason for your leave.");
      return;
    }

    if (leaveType !== "unpaid" && calculatedDays > currentAvailableBalance) {
      setSubmitError(
        `Insufficient leave balance. You are applying for ${calculatedDays} days, but have only ${currentAvailableBalance} days remaining.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMyLeave({
        workspaceId,
        leaveType,
        startDate: fromDate,
        endDate: toDate,
        session: fromDate === toDate ? fromSession : "full_day",
        contactDetails: contactDetails.trim() || undefined,
        reason: reason.trim(),
        fileAttachment: selectedFile?.name,
        storageId: uploadedStorageId ?? undefined,
      });
      setSubmitSuccess("Leave request submitted successfully for approval.");
      setReason("");
      setContactDetails("");
      setSelectedFile(null);
      setUploadedStorageId(null);
    } catch (err) {
      setSubmitError((err as Error).message || "Failed to submit leave request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelLeave = async (requestId: Id<"leaveRequests">) => {
    if (!workspaceId) return;
    if (!confirm("Are you sure you want to cancel this leave request?")) return;
    setCancellingId(requestId);
    try {
      await cancelMyLeave({ workspaceId, requestId });
    } catch (err) {
      alert((err as Error).message || "Failed to cancel leave request.");
    } finally {
      setCancellingId(null);
    }
  };

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-cyan-500" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                {activeTab === "apply"
                  ? "Leave Apply"
                  : activeTab === "balances"
                    ? "Leave Balances"
                    : activeTab === "calendar"
                      ? "Leave Calendar"
                      : activeTab === "holidays"
                        ? "Holiday Calendar"
                        : activeTab === "requests"
                          ? "Leave Requests & History"
                          : "Restricted Holidays & Comp-Off"}
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Apply for leaves, track granted balances, review approvals, and check statutory company holidays.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={activeTab === "apply" ? "default" : "outline"}
              onClick={() => setActiveTab("apply")}
              className="text-xs"
            >
              Apply Leave
            </Button>
            <Button
              size="sm"
              variant={activeTab === "balances" ? "default" : "outline"}
              onClick={() => setActiveTab("balances")}
              className="text-xs"
            >
              Balances
            </Button>
          </div>
        </div>

        {/* Sub Navigation Bar matching screenshot */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("apply")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "apply"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Leave Apply
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("balances")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "balances"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Leave Balances
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "calendar"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Leave Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("holidays")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "holidays"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Holiday Calendar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "requests"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Leave Requests ({myLeaves?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("restricted")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "restricted"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Restricted Holiday & Comp-Off
          </button>
        </div>

        {/* ── TAB 1: LEAVE APPLY (MATCHES SCREENSHOT 1) ────────────────────── */}
        {activeTab === "apply" && (
          <div className="space-y-5">
            {/* Informational Policy Banner from Screenshot 1 */}
            <div className="rounded-md border border-amber-300/40 bg-amber-50/60 p-3.5 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Leave is earned by an employee and granted by the employer to take time off work. The employee is free to avail this leave in accordance with the company policy.
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-primary mb-5">
                Applying for Leave
              </h2>

              <form onSubmit={handleSubmitLeave} className="space-y-5 max-w-3xl">
                {/* Leave Type */}
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Leave type <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) =>
                      setLeaveType(
                        e.target.value as
                          | "sick"
                          | "unpaid"
                          | "restricted_holiday"
                          | "comp_off",
                      )
                    }
                    className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="sick">Sick Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                    <option value="restricted_holiday">Restricted Holiday (RH)</option>
                    <option value="comp_off">Compensatory Off (Comp-Off)</option>
                  </select>
                </div>

                {/* From Date & Session */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="block text-xs font-medium text-primary/80 mb-1.5">
                      From date <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary/80 mb-1.5">
                      Session
                    </label>
                    <select
                      value={fromSession}
                      onChange={(e) =>
                        setFromSession(
                          e.target.value as "full_day" | "session_1" | "session_2",
                        )
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="session_1">Session 1 (First Half)</option>
                      <option value="session_2">Session 2 (Second Half)</option>
                      <option value="full_day">Full Day</option>
                    </select>
                  </div>
                </div>

                {/* To Date & Session + Balance Pill */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 max-w-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
                    <div>
                      <label className="block text-xs font-medium text-primary/80 mb-1.5">
                        To date <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-primary/80 mb-1.5">
                        Session
                      </label>
                      <select
                        value={toSession}
                        onChange={(e) =>
                          setToSession(
                            e.target.value as "full_day" | "session_1" | "session_2",
                          )
                        }
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      >
                        <option value="session_1">Session 1 (First Half)</option>
                        <option value="session_2">Session 2 (Second Half)</option>
                        <option value="full_day">Full Day</option>
                      </select>
                    </div>
                  </div>

                  {/* Real-time Balance & Applying Count matching screenshot */}
                  <div className="text-right sm:pl-4 sm:border-l border-border/60 shrink-0">
                    <p className="text-xs font-medium text-primary/70">
                      Leave Balance:{" "}
                      <span className="font-semibold text-primary font-mono">
                        {String(currentAvailableBalance).padStart(2, "0")}
                      </span>
                    </p>
                    <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                      Applying For:{" "}
                      <span className="font-semibold font-mono">
                        {calculatedDays} days
                      </span>
                    </p>
                  </div>
                </div>

                {/* Approver Snippet matching screenshot */}
                <div className="pt-2">
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Approver / Reporting Authority
                  </label>
                  <div className="flex items-center gap-3 rounded-md border border-border/80 bg-muted/30 p-2.5 max-w-md">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        Workspace Administrator
                      </p>
                      <p className="text-xs text-primary/50">
                        Human Resources & Payroll
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Details Input */}
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Contact details while on leave
                  </label>
                  <input
                    type="text"
                    value={contactDetails}
                    onChange={(e) => setContactDetails(e.target.value)}
                    placeholder="Emergency mobile number or address..."
                    className="w-full max-w-md rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Reason Textarea */}
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Reason <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter a reason..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Functional File Attachment Upload */}
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Attach Supporting Document (Optional)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-xs font-medium cursor-pointer hover:bg-muted/40 transition">
                      <UploadCloud className="h-4 w-4 text-primary/60" />
                      <span>{isUploadingFile ? "Uploading…" : "Choose File"}</span>
                      <input
                        type="file"
                        disabled={isUploadingFile}
                        onChange={handleFileChange}
                        accept=".pdf,.xls,.xlsx,.doc,.docx,.txt,.ppt,.pptx,.gif,.jpg,.jpeg,.png"
                        className="hidden"
                      />
                    </label>

                    {selectedFile && (
                      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-3 py-1.5 text-xs text-primary">
                        <Paperclip className="h-3.5 w-3.5 text-cyan-600" />
                        <span className="font-mono truncate max-w-xs">{selectedFile.name}</span>
                        {uploadedStorageId && (
                          <span className="text-[10px] text-emerald-600 font-semibold">✓ Ready</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setUploadedStorageId(null);
                          }}
                          className="text-primary/40 hover:text-destructive ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {fileUploadError && (
                    <p className="text-xs text-destructive mt-1.5">{fileUploadError}</p>
                  )}
                  <p className="text-[11px] text-primary/50 mt-1">
                    Allowed formats: PDF, Word, Excel, Images, Text (Max 5MB). Stored securely.
                  </p>
                </div>

                {/* Validation Feedback */}
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

                {/* Actions */}
                <div className="flex items-center gap-3 pt-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setReason("");
                      setContactDetails("");
                      setSubmitError(null);
                      setSubmitSuccess(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 2: LEAVE BALANCES (MATCHES SCREENSHOT 2) ─────────────────── */}
        {activeTab === "balances" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-primary">
                  Leave Entitlements & Balances ({new Date().getFullYear()})
                </h2>
                <p className="text-xs text-primary/60">
                  Real-time computation based on company leave policy and approved attendance logs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setActiveTab("apply")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                >
                  Apply
                </Button>
                <div className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium">
                  {new Date().getFullYear()}
                </div>
              </div>
            </div>

            {balances === undefined ? (
              <div className="flex h-48 w-full items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sick Leave Card matching screenshot 2 */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-primary/60">
                    <span className="font-semibold text-primary text-sm">
                      Sick Leave
                    </span>
                    <span>Granted: {balances.sick.granted}</span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold font-mono tracking-tight text-primary">
                      {String(balances.sick.balance).padStart(2, "0")}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary/50 mt-1">
                      Balance
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-primary/60">
                      <span>{balances.sick.consumed} of {balances.sick.granted} Consumed</span>
                      <span>{balances.sick.pending > 0 ? `${balances.sick.pending} Pending` : ""}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (balances.sick.consumed / (balances.sick.granted || 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("requests")}
                    className="text-xs text-cyan-600 hover:underline font-medium block text-center w-full pt-1"
                  >
                    View Details
                  </button>
                </div>

                {/* Casual Leave Card matching screenshot 2 */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-primary/60">
                    <span className="font-semibold text-primary text-sm">
                      Casual Leave
                    </span>
                    <span>Granted: {balances.casual.granted}</span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold font-mono tracking-tight text-primary">
                      {String(balances.casual.balance).padStart(2, "0")}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary/50 mt-1">
                      Balance
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-primary/60">
                      <span>{balances.casual.consumed} of {balances.casual.granted} Consumed</span>
                      <span>{balances.casual.pending > 0 ? `${balances.casual.pending} Pending` : ""}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (balances.casual.consumed / (balances.casual.granted || 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("requests")}
                    className="text-xs text-cyan-600 hover:underline font-medium block text-center w-full pt-1"
                  >
                    View Details
                  </button>
                </div>

                {/* Restricted Holiday Card */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-primary/60">
                    <span className="font-semibold text-primary text-sm">
                      Restricted Holiday
                    </span>
                    <span>Granted: 2</span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                      {String(balances.restricted_holiday?.balance ?? 2).padStart(2, "0")}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary/50 mt-1">
                      Balance
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-primary/60">
                      <span>{balances.restricted_holiday?.consumed ?? 0} of 2 Consumed</span>
                      <span>{balances.restricted_holiday?.pending ?? 0} Pending</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((balances.restricted_holiday?.consumed ?? 0) / 2) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("restricted");
                    }}
                    className="text-xs text-amber-600 hover:underline font-medium block text-center w-full pt-1"
                  >
                    View RH Policy & Apply
                  </button>
                </div>

                {/* Comp-Off Card */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-primary/60">
                    <span className="font-semibold text-primary text-sm">
                      Compensatory Off
                    </span>
                    <span>Granted: {balances.comp_off?.granted ?? 0}</span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold font-mono tracking-tight text-cyan-600 dark:text-cyan-400">
                      {String(balances.comp_off?.balance ?? 0).padStart(2, "0")}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary/50 mt-1">
                      Available Balance
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-primary/60">
                      <span>{balances.comp_off?.consumed ?? 0} of {balances.comp_off?.granted ?? 0} Used</span>
                      <span>{balances.comp_off?.pending ?? 0} Pending</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (balances.comp_off?.granted ?? 0) > 0
                              ? ((balances.comp_off?.consumed ?? 0) / (balances.comp_off?.granted || 1)) * 100
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("restricted");
                    }}
                    className="text-xs text-cyan-600 hover:underline font-medium block text-center w-full pt-1"
                  >
                    Request / View Comp-Off
                  </button>
                </div>

                {/* Loss Of Pay Card matching screenshot 2 */}
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between text-xs text-primary/60">
                    <span className="font-semibold text-primary text-sm">
                      Loss Of Pay
                    </span>
                    <span>Granted: 0</span>
                  </div>

                  <div className="text-center py-2">
                    <p className="text-4xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                      {balances.lop.consumed}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-primary/50 mt-1">
                      Days Deducted (LOP)
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-primary/60">
                      <span>Deducted from monthly payroll</span>
                      <span>Active</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${balances.lop.consumed > 0 ? 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-primary/40 text-center pt-1">
                    Directly synchronized with Attendance
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: LEAVE CALENDAR ────────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-primary">
                  {new Date(calendarYear, calendarMonth).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear((y) => y - 1);
                      } else {
                        setCalendarMonth((m) => m - 1);
                      }
                    }}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCalendarMonth(new Date().getMonth());
                      setCalendarYear(new Date().getFullYear());
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear((y) => y + 1);
                      } else {
                        setCalendarMonth((m) => m + 1);
                      }
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>

              {/* Monthly Calendar Grid */}
              <div className="grid grid-cols-7 gap-px rounded-md border border-border bg-border overflow-hidden text-center text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-muted py-2 font-semibold text-primary/70">
                    {day}
                  </div>
                ))}
                {["pad-sun", "pad-mon", "pad-tue", "pad-wed", "pad-thu", "pad-fri"].slice(
                  0,
                  new Date(calendarYear, calendarMonth, 1).getDay(),
                ).map((padKey) => (
                  <div key={padKey} className="bg-card/40 p-3 min-h-[70px]" />
                ))}
                {Array.from({
                  length: new Date(calendarYear, calendarMonth + 1, 0).getDate(),
                }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isLeave = myLeaves?.find(
                    (l) =>
                      l.status === "approved" &&
                      dateStr >= l.startDate &&
                      dateStr <= l.endDate,
                  );
                  const holiday = holidays?.find((h) => h.date === dateStr);
                  const isToday =
                    dateStr === new Date().toISOString().slice(0, 10);

                  return (
                    <div
                      key={dateStr}
                      className={`bg-card p-2 min-h-[70px] text-left transition ${
                        isToday ? "ring-2 ring-primary/40 ring-inset" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            isToday
                              ? "h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]"
                              : "text-primary/80"
                          }`}
                        >
                          {dayNum}
                        </span>
                      </div>
                      {isLeave && (
                        <div className="mt-1 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 text-[10px] font-medium truncate">
                          {isLeave.leaveType} leave
                        </div>
                      )}
                      {holiday && (
                        <div className="mt-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-medium truncate">
                          ★ {holiday.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: HOLIDAY CALENDAR ──────────────────────────────────────── */}
        {activeTab === "holidays" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-primary">
                    Company Holiday Calendar (2026)
                  </h2>
                  <p className="text-xs text-primary/60">
                    Statutory Indian Gazetted & Restricted Holidays.
                  </p>
                </div>
                <div className="text-xs text-primary/60">
                  Total: {holidays?.length ?? 0} Holidays
                </div>
              </div>

              {holidays === undefined ? (
                <div className="flex h-48 w-full items-center justify-center text-primary/40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="p-8 text-center text-sm text-primary/40">
                  No holidays configured.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Holiday Name</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Day</th>
                      <th className="px-6 py-3 font-medium">Classification</th>
                      <th className="px-6 py-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {holidays.map((h) => {
                      const d = new Date(h.date);
                      const dayName = Number.isNaN(d.getTime())
                        ? "—"
                        : d.toLocaleDateString("en-IN", { weekday: "long" });
                      return (
                        <tr key={`${h.date}-${h.name}`} className="hover:bg-muted/30 transition">
                          <td className="px-6 py-3 font-medium text-primary">
                            {h.name}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs text-primary/80">
                            {h.date}
                          </td>
                          <td className="px-6 py-3 text-primary/70">{dayName}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                h.type === "gazetted"
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {h.type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-primary/50">
                            {h.description || "National / Regional observance"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 5: LEAVE REQUESTS & HISTORY ──────────────────────────────── */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
              <div className="border-b border-border px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-primary">
                    My Leave Requests & Workflow History
                  </h2>
                  <p className="text-xs text-primary/60">
                    View submitted requests, HR approvals, and cancellation options.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("apply")}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                >
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Apply New
                </Button>
              </div>

              {myLeaves === undefined ? (
                <div className="flex h-48 w-full items-center justify-center text-primary/40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : myLeaves.length === 0 ? (
                <div className="p-8 text-center text-sm text-primary/40">
                  No leave requests submitted yet.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
                    <tr>
                      <th className="px-6 py-3 font-medium">Leave Type</th>
                      <th className="px-6 py-3 font-medium">Duration</th>
                      <th className="px-6 py-3 font-medium">Days</th>
                      <th className="px-6 py-3 font-medium">Reason</th>
                      <th className="px-6 py-3 font-medium">Attachment</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {myLeaves.map((l) => (
                      <tr key={l._id} className="hover:bg-muted/30 transition">
                        <td className="px-6 py-3 font-medium capitalize text-primary">
                          {l.leaveType} Leave
                        </td>
                        <td className="px-6 py-3 text-xs text-primary/80">
                          {l.startDate} to {l.endDate}
                          {l.session && l.session !== "full_day" && (
                            <span className="block text-[10px] text-primary/50">
                              ({l.session.replace("_", " ")})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 font-mono font-medium text-xs">
                          {l.daysCount}
                        </td>
                        <td className="px-6 py-3 text-xs text-primary/70 max-w-xs truncate">
                          {l.reason}
                        </td>
                        <td className="px-6 py-3 text-xs">
                          {l.storageId && workspaceId ? (
                            <AttachmentDownloadLink
                              workspaceId={workspaceId}
                              storageId={l.storageId}
                              fileName={l.fileAttachment || "attachment"}
                            />
                          ) : l.fileAttachment ? (
                            <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-primary/80">
                              <Paperclip className="h-3 w-3 text-cyan-600" />
                              <span className="truncate max-w-[120px]">{l.fileAttachment}</span>
                            </span>
                          ) : (
                            <span className="text-primary/40 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                              l.status === "approved"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : l.status === "rejected"
                                  ? "bg-red-500/10 text-red-500"
                                  : l.status === "cancelled"
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {l.status}
                          </span>
                          {l.reviewRemarks && (
                            <p className="text-[10px] text-primary/50 mt-0.5 italic">
                              &quot;{l.reviewRemarks}&quot;
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          {l.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancellingId === l._id}
                              onClick={() => handleCancelLeave(l._id)}
                              className="text-xs text-destructive hover:bg-destructive/10"
                            >
                              {cancellingId === l._id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Cancel"
                              )}
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
        )}

        {/* ── TAB 6: RESTRICTED HOLIDAYS & COMP-OFF ────────────────────────── */}
        {activeTab === "restricted" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Restricted Holidays Card */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-primary">
                      Restricted Holidays (RH)
                    </h3>
                  </div>
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    Balance: {balances?.restricted_holiday?.balance ?? 2} / 2
                  </span>
                </div>
                <p className="text-xs text-primary/70 leading-relaxed">
                  Restricted Holidays are optional days off granted as per statutory government orders. Employees are eligible to avail up to 2 Restricted Holidays per calendar year.
                </p>
                <div className="rounded-md bg-muted/40 p-3 text-xs space-y-2">
                  <p className="font-semibold text-primary">Eligible 2026 Restricted Holidays:</p>
                  <ul className="list-disc list-inside space-y-1 text-primary/60 font-mono">
                    <li>Maha Shivratri (17 Feb 2026)</li>
                    <li>Karva Chauth (28 Oct 2026)</li>
                    <li>Govardhan Puja (09 Nov 2026)</li>
                  </ul>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveTab("apply");
                    setLeaveType("restricted_holiday");
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs w-full"
                >
                  Apply For Restricted Holiday
                </Button>
              </div>

              {/* Comp-Off Grant Request Form */}
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-500" />
                    <h3 className="font-semibold text-primary">
                      Compensatory Off (Comp-Off)
                    </h3>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    Balance: {balances?.comp_off?.balance ?? 0} Day(s)
                  </span>
                </div>
                <p className="text-xs text-primary/70 leading-relaxed">
                  Worked on a scheduled weekend or gazetted company holiday? Request a Comp-Off grant below for manager approval.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!workspaceId) return;
                    setCompOffError(null);
                    setCompOffSuccess(null);
                    setIsSubmittingCompOff(true);
                    try {
                      await submitCompOff({
                        workspaceId,
                        workDate: compOffWorkDate,
                        daysCount: compOffDaysCount,
                        reason: compOffReason.trim(),
                      });
                      setCompOffSuccess("Comp-off grant request submitted for manager review.");
                      setCompOffReason("");
                    } catch (err) {
                      setCompOffError((err as Error).message || "Failed to submit comp-off request.");
                    } finally {
                      setIsSubmittingCompOff(false);
                    }
                  }}
                  className="space-y-3 pt-1"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-primary/80 mb-1">
                        Work Date Worked
                      </label>
                      <input
                        type="date"
                        required
                        value={compOffWorkDate}
                        onChange={(e) => setCompOffWorkDate(e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-primary/80 mb-1">
                        Grant Amount
                      </label>
                      <select
                        value={compOffDaysCount}
                        onChange={(e) => setCompOffDaysCount(Number(e.target.value))}
                        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                      >
                        <option value={1}>1.0 Full Day</option>
                        <option value={0.5}>0.5 Half Day</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-primary/80 mb-1">
                      Reason / Weekend Shift Details
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={compOffReason}
                      onChange={(e) => setCompOffReason(e.target.value)}
                      placeholder="e.g. Critical production release deployment shift on Saturday"
                      className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs"
                    />
                  </div>

                  {compOffError && (
                    <p className="text-xs text-destructive">{compOffError}</p>
                  )}
                  {compOffSuccess && (
                    <p className="text-xs text-emerald-500 font-medium">{compOffSuccess}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="submit"
                      disabled={isSubmittingCompOff}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                    >
                      {isSubmittingCompOff ? "Submitting…" : "Submit Comp-Off Request"}
                    </Button>
                    {balances && (balances.comp_off?.balance ?? 0) > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveTab("apply");
                          setLeaveType("comp_off");
                        }}
                        className="text-xs"
                      >
                        Apply Comp-Off Leave
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Comp-Off Grant History Table */}
            {myCompOffRequests && myCompOffRequests.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wide">
                  My Comp-Off Grant Requests
                </h4>
                <div className="divide-y divide-border/50 text-xs">
                  {myCompOffRequests.map((req) => (
                    <div key={req._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-primary">
                          Worked on {req.workDate} ({req.daysCount} Day grant)
                        </p>
                        <p className="text-[11px] text-primary/60 mt-0.5">{req.reason}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          req.status === "approved"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : req.status === "rejected"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
