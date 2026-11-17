"use client";

import {
  Banknote,
  Building2,
  CalendarDays,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Grid,
  HelpCircle,
  LayoutDashboard,
  LucideIcon,
  PieChart,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface QuickModule {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

interface ModuleGroup {
  category: string;
  modules: QuickModule[];
}

const MODULE_GROUPS: ModuleGroup[] = [
  {
    category: "Core HR & Directory",
    modules: [
      {
        title: "Employee Directory",
        description: "Staff master profiles, banking & status",
        href: "/employees",
        icon: Users,
      },
      {
        title: "Quick Onboarding",
        description: "Add employee with statutory fields",
        href: "/employees?action=add",
        icon: UserPlus,
        badge: "Fast Track",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      },
      {
        title: "People & Org Tree",
        description: "Department hierarchy and peer directory",
        href: "/people",
        icon: Building2,
      },
    ],
  },
  {
    category: "Workforce & Time Tracking",
    modules: [
      {
        title: "Attendance Muster",
        description: "Daily swipes, shifts & LOP deduction",
        href: "/attendance",
        icon: Clock,
      },
      {
        title: "Leave Approvals",
        description: "Review vacation, sick & privilege leaves",
        href: "/attendance?tab=leaves",
        icon: CalendarDays,
      },
      {
        title: "Holiday Calendar",
        description: "National & state statutory holidays",
        href: "/leave/holiday-calendar",
        icon: CalendarDays,
      },
    ],
  },
  {
    category: "Payroll & Compensation",
    modules: [
      {
        title: "Monthly Payroll Processing",
        description: "Execute runs, verify deductions & finalize",
        href: "/payroll",
        icon: Banknote,
        badge: "Primary",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      },
      {
        title: "Salary Structures & CTC",
        description: "Configure components, allowances & revisions",
        href: "/salaries",
        icon: Wallet,
      },
      {
        title: "Employee Payslips",
        description: "Generate & download compliant PDF slips",
        href: "/salary",
        icon: FileText,
      },
    ],
  },
  {
    category: "Indian Statutory & Compliance",
    modules: [
      {
        title: "EPFO ECR & Central PF",
        description: "Generate monthly EPFO electronic returns",
        href: "/compliance",
        icon: ShieldCheck,
      },
      {
        title: "Form 138 TDS & Income Tax",
        description: "Section 115BAC regime comparison & challans",
        href: "/compliance",
        icon: Scale,
      },
      {
        title: "Statutory & MIS Reports",
        description: "Excel/CSV registers, ESIC, PT & LWF",
        href: "/reports",
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    category: "Administration & Settings",
    modules: [
      {
        title: "Organization Profile",
        description: "Entity address, PAN/TAN & signatories",
        href: "/settings",
        icon: Settings,
      },
      {
        title: "Audit & Security Logs",
        description: "Track immutable payroll approvals & events",
        href: "/#audit-logs",
        icon: TrendingUp,
      },
    ],
  },
];

export function QuickLauncherModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const filteredGroups = MODULE_GROUPS.map((g) => ({
    ...g,
    modules: g.modules.filter(
      (m) =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        m.description.toLowerCase().includes(query.toLowerCase()) ||
        g.category.toLowerCase().includes(query.toLowerCase()),
    ),
  })).filter((g) => g.modules.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 sm:p-6 sm:pt-20 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Launcher Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Grid className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                IndiaPay Enterprise App Switcher
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                greytHR-Style 9-Dot Quick Access & HR Administration Modules
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <div className="border-b border-slate-200 px-6 py-3 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search administrative modules, reports, statutory tools or payroll..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-zinc-500"
          />
        </div>

        {/* Module Content Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500 dark:text-zinc-400">
              No matching modules found for &quot;{query}&quot;
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.category} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {group.category}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.modules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.title}
                        href={m.href}
                        onClick={() => onOpenChange(false)}
                        className="group relative flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-blue-500/40 hover:bg-blue-50/30 hover:shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-blue-500/40 dark:hover:bg-blue-950/20"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300 dark:group-hover:bg-blue-600 dark:group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-medium text-slate-800 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400 transition-colors truncate">
                              {m.title}
                            </h4>
                            {m.badge && (
                              <span
                                className={`rounded px-1.5 py-0.2 text-[10px] font-semibold border ${m.badgeColor}`}
                              >
                                {m.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-1">
                            {m.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Esc
              </kbd>{" "}
              to close
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                Ctrl + K
              </kbd>{" "}
              Command Palette
            </span>
          </div>
          <span className="font-medium text-blue-600 dark:text-blue-400">
            IndiaPay Enterprise SaaS
          </span>
        </div>
      </div>
    </div>
  );
}
