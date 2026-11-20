"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminTopbar } from "../admin-topbar";

interface AccountSettingsLayoutProps {
  children: React.ReactNode;
}

const TABS = [
  { name: "Plan", href: "/admin/account-settings/plan" },
  { name: "Invoices", href: "/admin/account-settings/invoices" },
  { name: "Payments", href: "/admin/account-settings/payments" },
  { name: "Ticket Management", href: "/admin/account-settings/tickets" },
  { name: "New Features", href: "/admin/account-settings/features" },
];

export default function AccountSettingsLayout({
  children,
}: AccountSettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 antialiased select-none pb-20">
      <AdminTopbar />

      {/* Account Settings Sub-navigation Bar matching greytHR */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6">
          <div className="flex items-center gap-3 py-3 pr-6 border-r border-slate-200">
            <span className="text-sm font-black tracking-tight text-slate-900">
              Account Settings
            </span>
          </div>

          <nav className="flex items-center gap-1 pl-4 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`relative px-4 py-3.5 text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
