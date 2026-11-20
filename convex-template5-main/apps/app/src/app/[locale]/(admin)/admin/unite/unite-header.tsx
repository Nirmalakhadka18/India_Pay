"use client";

import { Calendar, ChevronRight, Home, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AdminTopbar } from "../admin-topbar";

export interface UniteHeaderProps {
  onBookDemoClick?: () => void;
  onTakeTourClick?: () => void;
}

export function UniteHeader({
  onBookDemoClick,
  onTakeTourClick,
}: UniteHeaderProps) {
  const [selectedMonth, setSelectedMonth] = useState("Nov'26");
  const [selectedScope, setSelectedScope] = useState("All");

  return (
    <div className="w-full bg-white select-none">
      {/* 1. Global Admin Topbar (9-dot launcher, Victor Chasex, Search, Settings) */}
      <AdminTopbar />

      {/* 2. Secondary Unite Topbar */}
      <div className="flex h-12 w-full items-center justify-between border-b border-[#E4E9F0] bg-white px-6 text-sm">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
          >
            <Home className="h-3.5 w-3.5 text-slate-400" />
            <span>Home</span>
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800">
            Unite Marketplace
          </span>
        </div>

        {/* Right side context controls */}
        <div className="flex items-center gap-3">
          {/* Payroll Month Selector */}
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold text-slate-500">
              Payroll:
            </span>
            <span className="font-bold text-slate-800">{selectedMonth}</span>
          </div>

          {/* Employee Scope Selector */}
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50/50 px-2.5 py-1 text-xs text-slate-700">
            <span className="text-[11px] font-semibold text-slate-500">
              Scope:
            </span>
            <span className="font-bold text-slate-800">{selectedScope}</span>
          </div>

          {/* Quick Action: Take A Tour */}
          {onTakeTourClick && (
            <button
              type="button"
              onClick={onTakeTourClick}
              className="flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Take A Tour</span>
            </button>
          )}

          {/* Quick Action: Book A Demo */}
          {onBookDemoClick && (
            <button
              type="button"
              onClick={onBookDemoClick}
              className="flex items-center gap-1.5 rounded-md bg-[#2563EB] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
            >
              <span>Book A Demo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
