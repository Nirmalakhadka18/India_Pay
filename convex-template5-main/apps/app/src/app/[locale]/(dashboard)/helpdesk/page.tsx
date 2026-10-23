"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";

export default function HelpdeskPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const tickets = useQuery(api.helpdesk.listMyTickets, scoped);
  const createTicket = useMutation(api.helpdesk.createTicket);

  const [activeTab, setActiveTab] = useState<"history" | "new">("history");
  const [category, setCategory] = useState<
    "payroll" | "leaves" | "attendance" | "benefits" | "general"
  >("payroll");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(
    null,
  );

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSubmitError(null);
    setCreatedTicketNumber(null);

    if (!subject.trim()) {
      setSubmitError("Please enter a ticket subject.");
      return;
    }

    if (!description.trim()) {
      setSubmitError("Please describe your issue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketNum = await createTicket({
        workspaceId,
        category,
        priority,
        subject: subject.trim(),
        description: description.trim(),
      });
      setCreatedTicketNumber(ticketNum);
      setSubject("");
      setDescription("");
      setActiveTab("history");
    } catch (err) {
      setSubmitError((err as Error).message || "Failed to submit ticket.");
    } finally {
      setIsSubmitting(false);
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
              <span className="h-5 w-1 rounded-full bg-indigo-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                Helpdesk & HR Support
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Submit HR or payroll questions, dispute attendance/LOP deductions, and track query resolutions.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setActiveTab(activeTab === "new" ? "history" : "new")}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {activeTab === "new" ? "View My Tickets" : "New Support Ticket"}
          </Button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b border-border pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "history"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            My Tickets ({tickets?.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("new")}
            className={`rounded-md px-3 py-1.5 transition ${
              activeTab === "new"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-primary/70 hover:bg-muted"
            }`}
          >
            Submit New Ticket
          </button>
        </div>

        {createdTicketNumber && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              Ticket <strong>#{createdTicketNumber}</strong> created successfully. Human Resources has been notified.
            </span>
          </div>
        )}

        {/* ── NEW TICKET FORM ──────────────────────────────────────────────── */}
        {activeTab === "new" ? (
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm max-w-2xl">
            <h2 className="text-base font-semibold text-primary mb-4">
              Submit a Support Ticket
            </h2>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value as
                          | "payroll"
                          | "leaves"
                          | "attendance"
                          | "benefits"
                          | "general",
                      )
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="payroll">Payroll & Salary Slip</option>
                    <option value="leaves">Leave & Balances</option>
                    <option value="attendance">Attendance & Biometrics</option>
                    <option value="benefits">EPF, ESI & Statutory Benefits</option>
                    <option value="general">General HR Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-primary/80 mb-1.5">
                    Priority <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value as "low" | "medium" | "high" | "urgent",
                      )
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Subject / Summary <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Discrepancy in April payslip TDS deduction"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-primary/80 mb-1.5">
                  Detailed Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide full details including dates, transaction numbers, or specific payroll runs..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("history")}
                  className="text-xs"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          /* ── TICKET HISTORY TABLE ───────────────────────────────────────── */
          <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
            <div className="border-b border-border px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-primary">
                  My Support Ticket History
                </h2>
                <p className="text-xs text-primary/60">
                  Track ticket assignments, HR responses, and resolution status.
                </p>
              </div>
            </div>

            {tickets === undefined ? (
              <div className="flex h-48 items-center justify-center text-primary/40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-12 text-center text-sm text-primary/50 space-y-3">
                <LifeBuoy className="mx-auto h-8 w-8 text-primary/30" />
                <p>No support tickets submitted yet.</p>
                <Button
                  size="sm"
                  onClick={() => setActiveTab("new")}
                  className="text-xs"
                >
                  Submit a Query
                </Button>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-primary/60 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Ticket #</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium">Subject</th>
                    <th className="px-6 py-3 font-medium">Priority</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tickets.map((t) => (
                    <tr key={t._id} className="hover:bg-muted/30 transition">
                      <td className="px-6 py-3.5 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        #{t.ticketNumber}
                      </td>
                      <td className="px-6 py-3.5 text-xs capitalize text-primary/70">
                        {t.category}
                      </td>
                      <td className="px-6 py-3.5 text-xs font-medium text-primary max-w-sm">
                        <p className="truncate font-semibold">{t.subject}</p>
                        <p className="truncate text-primary/50 text-[11px] mt-0.5">
                          {t.description}
                        </p>
                        {t.resolutionRemarks && (
                          <p className="text-emerald-600 dark:text-emerald-400 text-[11px] mt-1 font-medium">
                            HR Resolution: {t.resolutionRemarks}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            t.priority === "urgent"
                              ? "bg-red-500/10 text-red-600"
                              : t.priority === "high"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            t.status === "resolved" || t.status === "closed"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : t.status === "in_progress"
                                ? "bg-blue-500/10 text-blue-600"
                                : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-primary/60 font-mono">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
