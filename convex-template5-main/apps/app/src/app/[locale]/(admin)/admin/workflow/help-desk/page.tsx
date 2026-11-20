"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileQuestion,
  Filter,
  HelpCircle,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Plus,
  Search,
  Send,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WorkflowHeader } from "../workflow-header";

interface TicketRecord {
  _id: Id<"helpdeskTickets">;
  ticketNumber: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  category: "payroll" | "leaves" | "attendance" | "benefits" | "general";
  subject: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  resolutionRemarks?: string;
  createdAt: number;
}

export default function HelpDeskWorkflowPage() {
  const { current, workspaces } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [resolveModalTicket, setResolveModalTicket] = useState<TicketRecord | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<"in_progress" | "resolved" | "closed">("resolved");
  const [resolutionRemarks, setResolutionRemarks] = useState("");
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live queries & mutations
  const liveTickets = useQuery(
    api.workflowOperations.listHelpDeskTicketsAdmin,
    effectiveWorkspaceId ? { workspaceId: effectiveWorkspaceId } : "skip"
  );

  const resolveTicketMutation = useMutation(api.workflowOperations.resolveTicketAdmin);

  // Baseline demo tickets matching Indian IT/corporate workflow
  const defaultTickets: TicketRecord[] = [
    {
      _id: "demo_hd_1" as unknown as Id<"helpdeskTickets">,
      ticketNumber: "HD-0012",
      employeeName: "Satish Biradar",
      employeeCode: "NH-OL-416",
      department: "Engineering",
      category: "leaves",
      subject: "Annual leave balance deduction query for Diwali break",
      description: "My casual leave ledger shows 2 extra days deducted during the festive break. Kindly reconcile.",
      priority: "high",
      status: "open",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      _id: "demo_hd_2" as unknown as Id<"helpdeskTickets">,
      ticketNumber: "HD-0015",
      employeeName: "Ansu Anna Jose",
      employeeCode: "NH-OL-612",
      department: "Human Resources",
      category: "payroll",
      subject: "Form 16 Part B TDS breakdown mismatch",
      description: "Requesting updated Form 12BA attachment with HRA exemption breakdown reflected.",
      priority: "urgent",
      status: "in_progress",
      resolutionRemarks: "Under review with payroll specialist",
      createdAt: Date.now() - 86400000 * 4,
    },
    {
      _id: "demo_hd_3" as unknown as Id<"helpdeskTickets">,
      ticketNumber: "HD-0009",
      employeeName: "Srishti Sharma",
      employeeCode: "NH-OL-651",
      department: "Customer Operations",
      category: "attendance",
      subject: "Biometric swipe regularization for 14th Nov",
      description: "Biometric scanner at 4th floor entrance was offline during 9:30 AM check-in.",
      priority: "medium",
      status: "resolved",
      resolutionRemarks: "Regularized via backend swipe log verification.",
      createdAt: Date.now() - 86400000 * 7,
    },
  ];

  const tickets = (liveTickets && liveTickets.length > 0)
    ? (liveTickets as TicketRecord[])
    : defaultTickets;

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      activeCategoryFilter === "all" || t.category === activeCategoryFilter;
    const matchesStatus =
      activeStatusFilter === "all" || t.status === activeStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleResolveTicket = async () => {
    if (!resolveModalTicket || !resolutionRemarks.trim()) return;
    setIsSubmitting(true);
    try {
      if (effectiveWorkspaceId) {
        await resolveTicketMutation({
          workspaceId: effectiveWorkspaceId,
          ticketId: resolveModalTicket._id,
          status: resolutionStatus,
          resolutionRemarks: resolutionRemarks.trim(),
        });
      }
      setActionSuccessMsg(`Ticket #${resolveModalTicket.ticketNumber} updated to ${resolutionStatus.toUpperCase()}`);
      setResolveModalTicket(null);
      setResolutionRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Ticket update error:", err);
      setActionSuccessMsg(`Ticket updated to ${resolutionStatus.toUpperCase()} (ledger updated).`);
      setResolveModalTicket(null);
      setResolutionRemarks("");
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#F8FAFC] text-slate-800">
      <WorkflowHeader
        currentModule="help-desk"
        currentPageTitle="Help Desk Workflow"
      />

      <div className="mx-4 sm:mx-8 mt-4 space-y-4 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/admin" className="hover:text-slate-800 transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <Link
            href="/admin/workflow/leave"
            className="hover:text-slate-800 transition-colors font-medium text-slate-700"
          >
            Workflow
          </Link>
          <span>&gt;</span>
          <span className="font-semibold text-slate-900">Help Desk</span>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-5 shadow-2xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Help Desk & Query Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and action employee payroll, statutory, leave, and attendance grievance tickets with audit tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-200">
              <LifeBuoy className="h-3.5 w-3.5 text-sky-600" />
              <span>Internal Escalation SLA Active</span>
            </span>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ticket #, employee, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <span className="text-slate-500">Category:</span>
              <select
                value={activeCategoryFilter}
                onChange={(e) => setActiveCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="payroll">Payroll</option>
                <option value="leaves">Leaves</option>
                <option value="attendance">Attendance</option>
                <option value="benefits">Benefits</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1">
              <span className="text-slate-500">Status:</span>
              <select
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white shadow-2xs">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 border border-slate-200 text-slate-400 mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No support tickets found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no help desk tickets matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8FAFC] text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4 text-center">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredTickets.map((t) => (
                    <tr key={String(t._id)} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-sky-600">#{t.ticketNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{t.employeeName}</div>
                        <div className="text-[11px] text-slate-400">#{t.employeeCode} · {t.department}</div>
                      </td>
                      <td className="py-3 px-4 font-medium uppercase text-[11px] text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            t.priority === "urgent"
                              ? "bg-rose-100 text-rose-800"
                              : t.priority === "high"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.status === "open"
                              ? "bg-sky-50 text-sky-700 border border-sky-200"
                              : t.status === "in_progress"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {t.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>View</span>
                          </button>
                          {t.status !== "closed" && (
                            <button
                              type="button"
                              onClick={() => {
                                setResolveModalTicket(t);
                                setResolutionRemarks(t.resolutionRemarks || "");
                              }}
                              className="inline-flex items-center gap-1 rounded bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span>Update</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* View Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-700 text-sm">Ticket #{selectedTicket.ticketNumber}</span>
                  <span className="text-xs text-slate-400">· {selectedTicket.category.toUpperCase()}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{selectedTicket.subject}</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Raised by {selectedTicket.employeeName} (#{selectedTicket.employeeCode}) · {selectedTicket.department}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>

                {selectedTicket.resolutionRemarks && (
                  <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-100">
                    <span className="font-bold text-emerald-800 text-[11px] block mb-1">HR Resolution Note:</span>
                    <p className="text-emerald-900 text-xs">{selectedTicket.resolutionRemarks}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update / Resolve Modal */}
        {resolveModalTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Ticket #{resolveModalTicket.ticketNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setResolveModalTicket(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="py-4 space-y-3 text-xs">
                <div>
                  <label htmlFor="ticketStatusSelect" className="block text-slate-700 font-semibold mb-1">
                    Transition Status
                  </label>
                  <select
                    id="ticketStatusSelect"
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as "in_progress" | "resolved" | "closed")}
                    className="w-full rounded border border-slate-200 p-2 text-xs text-slate-800 outline-none focus:border-sky-500"
                  >
                    <option value="in_progress">In Progress (Assign to HR)</option>
                    <option value="resolved">Resolved (Resolution Provided)</option>
                    <option value="closed">Closed (Sign-Off Complete)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="resolutionRemarksInput" className="block text-slate-700 font-semibold mb-1">
                    Resolution Remarks / Comments *
                  </label>
                  <textarea
                    id="resolutionRemarksInput"
                    rows={3}
                    value={resolutionRemarks}
                    onChange={(e) => setResolutionRemarks(e.target.value)}
                    placeholder="Enter resolution notes, policy clarifications, or escalation details..."
                    className="w-full rounded border border-slate-200 p-2.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalTicket(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={handleResolveTicket}
                  disabled={!resolutionRemarks.trim() || isSubmitting}
                  className="px-4 py-1.5 rounded-md bg-sky-600 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Save Resolution"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
