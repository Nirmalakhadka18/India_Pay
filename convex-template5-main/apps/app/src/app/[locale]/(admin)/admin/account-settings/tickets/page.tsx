"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TicketMessage = {
  sender: string;
  senderRole: string;
  message: string;
  timestamp: string;
};

type TicketItem = {
  _id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  dateOfCreation: string;
  lastActivity: string;
  createdByEmail: string;
  createdByName: string;
  messages: TicketMessage[];
};

export default function TicketManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // New ticket modal state
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Payroll Query");
  const [priority, setPriority] = useState<
    "low" | "medium" | "high" | "urgent"
  >("medium");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Selected ticket detail drawer
  const [activeTicket, setActiveTicket] = useState<TicketItem | null>(null);

  const tickets = useQuery(api.accountSettings.getTickets, {
    searchTerm: searchTerm.trim() || undefined,
    status: statusFilter,
  });

  const createTicket = useMutation(api.accountSettings.createTicket);

  const totalItems = tickets ? tickets.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedTickets = ((tickets as unknown as TicketItem[]) || []).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setCreating(true);
    try {
      await createTicket({
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
      });
      setNewTicketOpen(false);
      setSubject("");
      setDescription("");
    } catch (err) {
      console.error("Failed to create ticket:", err);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "In Progress":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb matching greytHR */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/admin" className="hover:text-slate-700">
            Home
          </Link>
          <span className="text-slate-400">&gt;</span>
          <span className="text-slate-800">Ticket Management</span>
        </div>

        <button
          type="button"
          onClick={() => setNewTicketOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Controls Toolbar: Search, Columns, Filter */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search ticket subject or ID"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>

            {/* Column Settings */}
            <button
              type="button"
              aria-label="columns"
              onClick={() => setShowColumnsModal(!showColumnsModal)}
              title="Column Settings"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                showColumnsModal
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {/* Filter */}
            <button
              type="button"
              aria-label="filter"
              onClick={() => setShowFilterModal(!showFilterModal)}
              title="Filter"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${
                showFilterModal
                  ? "border-blue-500 bg-blue-50 text-blue-600"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tickets Table matching greytHR columns */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-700 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold w-28">Ticket ID</th>
                <th className="py-3 px-4 font-bold">Subject</th>
                <th className="py-3 px-4 font-bold w-36">Last Activity</th>
                <th className="py-3 px-4 font-bold w-36">Date of Creation</th>
                <th className="py-3 px-4 font-bold w-28">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets === undefined ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading support tickets...
                  </td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((tkt) => (
                  <tr key={tkt._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">
                      <button
                        type="button"
                        onClick={() => setActiveTicket(tkt)}
                        className="hover:underline font-mono font-bold text-blue-600 text-left"
                      >
                        {tkt.ticketId}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <button
                        type="button"
                        onClick={() => setActiveTicket(tkt)}
                        className="hover:underline text-left font-medium text-slate-900"
                      >
                        {tkt.subject}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {tkt.lastActivity}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {tkt.dateOfCreation}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-bold border ${getStatusBadge(
                          tkt.status,
                        )}`}
                      >
                        {tkt.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-[#FAFBFD] text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>Items per page</span>
            </div>
            <span className="text-slate-400">|</span>
            <span>Total Items: {totalItems}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Drawer */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <span className="font-mono text-xs font-bold text-blue-600">
                    Ticket #{activeTicket.ticketId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                    {activeTicket.subject}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 mb-6 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">
                    Category:
                  </span>
                  <span className="font-bold text-slate-800">
                    {activeTicket.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] border ${getStatusBadge(activeTicket.status)}`}
                  >
                    {activeTicket.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">
                    Created Date:
                  </span>
                  <span>{activeTicket.dateOfCreation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">
                    Last Activity:
                  </span>
                  <span>{activeTicket.lastActivity}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-3">
                  Conversation Updates:
                </h4>
                <div className="space-y-3">
                  {activeTicket.messages?.map((msg, i) => (
                    <div
                      key={`${msg.sender}-${msg.timestamp}-${i}`}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                        <span className="font-bold text-slate-900">
                          {msg.sender} ({msg.senderRole})
                        </span>
                        <span className="text-[10.5px] text-slate-400">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTicket(null)}
              className="mt-6 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {newTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900">
                Create New Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setNewTicketOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter ticket subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="Payroll Query">Payroll Query</option>
                  <option value="Statutory Compliance">
                    Statutory Compliance (PF/ESI/TDS)
                  </option>
                  <option value="Attendance & Leave">Attendance & Leave</option>
                  <option value="Reports & Query Builder">
                    Reports & Query Builder
                  </option>
                  <option value="Technical Issue">Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) =>
                    setPriority(
                      e.target.value as "low" | "medium" | "high" | "urgent",
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Provide detailed description of the issue or inquiry"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewTicketOpen(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
