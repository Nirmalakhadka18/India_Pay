"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  FileText,
  Filter,
  KeyRound,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState } from "react";

export function LoginHistoryTab() {
  const summary = useQuery(api.users.getLoginHistorySummary);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");

  // Calculate start/end date filters if set
  let startDate: number | undefined;
  if (dateFilter === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    startDate = d.getTime();
  } else if (dateFilter === "week") {
    startDate = Date.now() - 7 * 24 * 60 * 60 * 1000;
  } else if (dateFilter === "month") {
    startDate = Date.now() - 30 * 24 * 60 * 60 * 1000;
  }

  const loginEvents = useQuery(api.users.getLoginHistoryList, {
    searchTerm: searchTerm.trim() || undefined,
    sortOrder,
    startDate,
  });

  const totalItems = loginEvents ? loginEvents.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedEvents = (loginEvents || []).slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const formatTimestamp = (ts: number | null | undefined) => {
    if (!ts) return "-";
    return new Date(ts).toISOString();
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Login Details Summary Header & Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Login Details</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Card 1: Last Login Date */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                Last Login Date
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Clock className="h-4 w-4" />
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">
              {summary === undefined ? (
                <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                formatTimestamp(summary.lastLoginDate)
              )}
            </div>
          </div>

          {/* Card 2: Last Login Failure Date */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                Last Login Failure Date
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <ShieldAlert className="h-4 w-4" />
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">
              {summary === undefined ? (
                <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                formatTimestamp(summary.lastLoginFailureDate)
              )}
            </div>
          </div>

          {/* Card 3: Password Changed Date */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">
                Password Changed Date
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <KeyRound className="h-4 w-4" />
              </span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">
              {summary === undefined ? (
                <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                formatTimestamp(summary.passwordChangedDate)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Controls Toolbar: Search, Columns, Filter */}
        <div className="flex flex-col gap-3 p-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search by employee name, no. or email"
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
            {/* Date filter dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(
                  e.target.value as "all" | "today" | "week" | "month",
                );
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            {/* Column settings button */}
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

            {/* Filter button */}
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

        {/* Column settings popover */}
        {showColumnsModal && (
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Columns:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="rounded text-blue-600"
              />
              <span>Date</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="rounded text-blue-600"
              />
              <span>IP Address</span>
            </label>
          </div>
        )}

        {/* Filter popover */}
        {showFilterModal && (
          <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Filter Order:</span>
            <button
              type="button"
              onClick={toggleSort}
              className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:underline"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </span>
            </button>
          </div>
        )}

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBFD] text-slate-700 border-b border-slate-200 select-none">
              <tr>
                <th className="py-3 px-4 font-bold w-1/2">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="flex items-center gap-1.5 hover:text-blue-600 transition"
                  >
                    <span>Date</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 font-bold text-slate-700 w-1/2">
                  IP Address
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loginEvents === undefined ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-slate-400">
                    Loading login history records...
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <ShieldCheck className="h-7 w-7 text-slate-300" />
                      <p className="font-semibold text-slate-600">
                        No login history records found
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {searchTerm
                          ? "Try adjusting your search criteria."
                          : "Authentication sessions will appear here as they occur."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => (
                  <tr key={evt._id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono text-slate-800 text-[11.5px]">
                      {evt.date}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700 text-[11.5px]">
                      {evt.ipAddress}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Table Footer */}
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
                aria-label="First page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Last page"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
