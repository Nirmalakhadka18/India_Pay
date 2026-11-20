"use client";

import {
  Binary,
  Boxes,
  Building,
  ChevronRight,
  FolderTree,
  LogOut,
  Sliders,
  Users,
} from "lucide-react";
import Link from "next/link";

interface SettingsCard {
  title: string;
  description: string;
  href: string;
  icon: any;
  badge?: string;
}

const EMPLOYEE_SETTINGS_CARDS: SettingsCard[] = [
  {
    title: "Employee Options",
    description: "Configure general employee options, probation periods, and notification preferences.",
    href: "/admin/system-settings/employee/preferences",
    icon: Sliders,
  },
  {
    title: "Employee No Series",
    description: "Define auto-numbering series, prefixes, starting numbers, and padding rules for employee IDs.",
    href: "/admin/system-settings/employee/emp-no-series",
    icon: Binary,
    badge: "Master",
  },
  {
    title: "Category Group",
    description: "Map and arrange employee categories for filters, reviews, and transition groups across screens.",
    href: "/admin/system-settings/employee/transitiongroup",
    icon: FolderTree,
  },
  {
    title: "Employee Positions",
    description: "Manage job positions, designations, reporting lines, and approved headcounts.",
    href: "/admin/system-settings/employee/positions",
    icon: Users,
  },
  {
    title: "Leaving Reasons",
    description: "Define exit reasons, statutory PF exit codes, and resignation workflows.",
    href: "/admin/system-settings/employee/leaving-reason",
    icon: LogOut,
  },
  {
    title: "Asset Group Settings",
    description: "Configure company equipment, depreciation schedules, returnable policies, and approvals.",
    href: "/admin/system-settings/employee/asset-group-settings",
    icon: Boxes,
  },
  {
    title: "Employee Directory Configuration",
    description: "Control visible fields, contact cards, and directory privacy across the organization.",
    href: "/admin/system-settings/employee/dirconfig",
    icon: Building,
  },
];

export default function EmployeeSettingsHubPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Link href="/admin/employee/main/overview" className="hover:text-blue-600 transition">
          Settings
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="text-slate-800 font-semibold">Employee Settings</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-black tracking-tight text-slate-900">
          Employee System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure employee numbering, categories, directory visibility, exit reasons, asset groups, and organizational positions.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {EMPLOYEE_SETTINGS_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-400 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  {card.badge && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 border border-blue-100">
                      {card.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-600">
                <span>Configure</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
