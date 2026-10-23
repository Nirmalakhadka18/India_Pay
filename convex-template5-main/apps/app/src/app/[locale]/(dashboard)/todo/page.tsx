"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { Button } from "@v1/ui/button";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  HelpCircle,
  ListTodo,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function TodoPage() {
  const { current: workspaceId } = useWorkspace();
  const scoped = workspaceId ? { workspaceId } : "skip";

  const me = useQuery(api.employees.getMyProfile, scoped);
  const myLeaves = useQuery(api.leaves.getMyLeaves, scoped);
  const tickets = useQuery(api.helpdesk.listMyTickets, scoped);
  const resignation = useQuery(api.resignation.getMyResignation, scoped);

  // Compute pending actionable items
  const pendingLeaves = useMemo(() => {
    return myLeaves?.filter((l) => l.status === "pending") ?? [];
  }, [myLeaves]);

  const openTickets = useMemo(() => {
    return tickets?.filter((t) => t.status === "open" || t.status === "in_progress") ?? [];
  }, [tickets]);

  const hasPendingResignation = resignation && resignation.status === "pending";

  const totalPendingActions =
    pendingLeaves.length + openTickets.length + (hasPendingResignation ? 1 : 0);

  if (!workspaceId) {
    return <div className="p-8 text-muted-foreground">Select a workspace.</div>;
  }

  return (
    <div className="flex h-full w-full bg-secondary px-4 py-6 md:px-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-purple-600" />
              <h1 className="text-xl font-bold tracking-tight text-primary">
                To Do & Action Center
              </h1>
            </div>
            <p className="text-xs text-primary/60 mt-1">
              Your pending requests, approval statuses, HR action items, and open tickets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <ListTodo className="h-3.5 w-3.5" /> {totalPendingActions} Pending Action(s)
            </span>
          </div>
        </div>

        {/* Action Items List */}
        <div className="space-y-4">
          {totalPendingActions === 0 ? (
            <div className="rounded-lg border border-border bg-card p-12 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <h3 className="text-base font-semibold text-primary">
                All caught up!
              </h3>
              <p className="text-xs text-primary/60 max-w-md mx-auto">
                You have no pending approvals, unanswered tickets, or outstanding HR action items.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* Pending Leaves */}
              {pendingLeaves.map((l) => (
                <div
                  key={l._id}
                  className="rounded-lg border border-amber-500/30 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <CalendarClock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary">
                        Leave Request Awaiting Review: {l.startDate} to {l.endDate}
                      </p>
                      <p className="text-xs text-primary/60 mt-0.5">
                        {l.daysCount} day(s) of <span className="capitalize">{l.leaveType}</span> leave submitted. Manager review pending.
                      </p>
                      <p className="text-[11px] text-primary/50 italic mt-1">
                        &quot;{l.reason}&quot;
                      </p>
                    </div>
                  </div>
                  <Link href="/leave">
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      View Request
                    </Button>
                  </Link>
                </div>
              ))}

              {/* Pending Resignation */}
              {hasPendingResignation && (
                <div className="rounded-lg border border-blue-500/30 bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-primary">
                        Formal Resignation Under HR Review
                      </p>
                      <p className="text-xs text-primary/60 mt-0.5">
                        Proposed date: {resignation.proposedResignationDate} • Notice period: {resignation.noticePeriodDays} days • Expected LWD: {resignation.expectedLastWorkingDay}
                      </p>
                    </div>
                  </div>
                  <Link href="/worklife">
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      Track Status
                    </Button>
                  </Link>
                </div>
              )}

              {/* Open Helpdesk Tickets */}
              {openTickets.map((t) => (
                <div
                  key={t._id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">
                          #{t.ticketNumber}
                        </span>
                        <span className="capitalize text-xs font-semibold text-primary">
                          {t.subject}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 capitalize">
                          {t.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-xs text-primary/60 mt-1 line-clamp-1">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  <Link href="/helpdesk">
                    <Button variant="outline" size="sm" className="text-xs shrink-0">
                      View Ticket
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
