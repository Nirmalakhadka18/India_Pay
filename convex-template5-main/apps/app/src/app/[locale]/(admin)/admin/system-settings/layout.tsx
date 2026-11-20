"use client";

import { ChevronDown, Sliders } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminTopbar } from "../admin-topbar";

interface SystemSettingsLayoutProps {
  children: React.ReactNode;
}

export default function SystemSettingsLayout({
  children,
}: SystemSettingsLayoutProps) {
  const pathname = usePathname();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navSections = [
    {
      id: "general",
      label: "General",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/general"),
      items: [
        {
          label: "Company Settings",
          href: "/admin/system-settings/general/company-info",
        },
        {
          label: "General Options",
          href: "/admin/system-settings/general/preferences",
        },
        {
          label: "List of Values",
          href: "/admin/system-settings/general/lov",
        },
        {
          label: "Bank Branch",
          href: "/admin/system-settings/general/bank-branch",
        },
        {
          label: "Company Bank Details",
          href: "/admin/system-settings/general/company-bank",
        },
        {
          label: "States",
          href: "/admin/system-settings/general/state",
        },
      ],
    },
    {
      id: "employee",
      label: "Employee",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/employee"),
      items: [
        {
          label: "Employee Hub",
          href: "/admin/system-settings/employee",
        },
        {
          label: "Employee Options",
          href: "/admin/system-settings/employee/preferences",
        },
        {
          label: "Employee No Series",
          href: "/admin/system-settings/employee/emp-no-series",
        },
        {
          label: "Category Group",
          href: "/admin/system-settings/employee/transitiongroup",
        },
        {
          label: "Employee Positions",
          href: "/admin/system-settings/employee/positions",
        },
        {
          label: "Leaving Reasons",
          href: "/admin/system-settings/employee/leaving-reason",
        },
        {
          label: "Asset Group Settings",
          href: "/admin/system-settings/employee/asset-group-settings",
        },
        {
          label: "Employee Directory Config",
          href: "/admin/system-settings/employee/dirconfig",
        },
      ],
    },
    {
      id: "payroll",
      label: "Payroll",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/payroll"),
      items: [
        {
          label: "Payroll Options",
          href: "/admin/system-settings/payroll/preferences",
        },
        {
          label: "Statutory Settings",
          href: "/admin/system-settings/payroll/preferences",
        },
        {
          label: "FBP Policy Setup",
          href: "/admin/system-settings/payroll/preferences",
        },
      ],
    },
    {
      id: "income-tax",
      label: "Income Tax",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/income-tax"),
      items: [
        {
          label: "Income Tax Options",
          href: "/admin/system-settings/income-tax/preferences",
        },
        {
          label: "Tax Slabs",
          href: "/admin/system-settings/income-tax/preferences",
        },
        {
          label: "IT Declarations Master",
          href: "/admin/system-settings/income-tax/preferences",
        },
      ],
    },
    {
      id: "leave",
      label: "Leave",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/leave"),
      items: [
        {
          label: "Leave Options",
          href: "/admin/system-settings/leave/preferences",
        },
        {
          label: "Leave Scheme",
          href: "/admin/system-settings/leave/preferences",
        },
        {
          label: "Weekend Policy",
          href: "/admin/system-settings/leave/preferences",
        },
      ],
    },
    {
      id: "integrations",
      label: "Integrations",
      hasDropdown: false,
      href: "/admin/system-settings/integrations",
      active: pathname?.includes("/system-settings/integrations"),
    },
    {
      id: "more",
      label: "More",
      hasDropdown: true,
      active: pathname?.includes("/system-settings/more"),
      items: [
        {
          label: "Attendance Policy",
          href: "/admin/system-settings/leave/preferences",
        },
        {
          label: "Claims & Reimbursements",
          href: "/admin/system-settings/payroll/preferences",
        },
        {
          label: "Mail Event Handlers",
          href: "/admin/system-settings/general/preferences",
        },
        {
          label: "Event Notifications",
          href: "/admin/system-settings/general/preferences",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 antialiased select-none pb-20">
      <AdminTopbar />

      {/* greytHR System Settings Sub-navigation Bar */}
      <div className="border-b border-slate-200 bg-white" ref={navRef}>
        <div className="mx-auto flex max-w-7xl items-center px-6">
          <div className="flex items-center gap-3 py-3 pr-6 border-r border-slate-200">
            <span className="text-sm font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>System Settings</span>
            </span>
          </div>

          <nav className="flex items-center gap-1 pl-3 overflow-x-auto">
            {navSections.map((sec) => (
              <div key={sec.id} className="relative">
                {sec.hasDropdown ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenu(openMenu === sec.id ? null : sec.id)
                    }
                    className={`flex items-center gap-1 px-3 py-3 text-xs font-bold transition rounded-lg ${
                      sec.active
                        ? "text-blue-600 bg-blue-50/50"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sec.label}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                ) : (
                  <Link
                    href={sec.href!}
                    onClick={() => setOpenMenu(null)}
                    className={`flex items-center gap-1 px-3 py-3 text-xs font-bold transition rounded-lg ${
                      sec.active
                        ? "text-blue-600 bg-blue-50/50"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    <span>{sec.label}</span>
                  </Link>
                )}

                {sec.hasDropdown && openMenu === sec.id && (
                  <div className="absolute left-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {sec.items?.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
