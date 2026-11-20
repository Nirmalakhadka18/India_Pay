"use client";

import {
  ChevronDown,
  Link as LinkIcon,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminTopbar } from "../admin-topbar";

interface UserAdminLayoutProps {
  children: React.ReactNode;
}

export default function UserAdminLayout({ children }: UserAdminLayoutProps) {
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [linkedMenuOpen, setLinkedMenuOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);
  const linkedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (linkedRef.current && !linkedRef.current.contains(e.target as Node)) {
        setLinkedMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isRolesActive = pathname?.includes("/roles");
  const isUsersActive = pathname?.includes("/users");
  const isLinkedActive = pathname?.includes("/linked-employees");

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-800 antialiased select-none pb-20">
      <AdminTopbar />

      {/* User Administration Sub-navigation Bar matching greytHR */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6">
          <div className="flex items-center gap-3 py-3 pr-6 border-r border-slate-200">
            <span className="text-sm font-black tracking-tight text-slate-900">
              User Administration
            </span>
          </div>

          <nav className="flex items-center gap-2 pl-4">
            {/* User Dropdown */}
            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLinkedMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition rounded-lg ${
                  isRolesActive || isUsersActive
                    ? "text-blue-600 bg-blue-50/50"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>User</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute left-0 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/admin/user-administration/roles"
                    onClick={() => setUserMenuOpen(false)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition ${
                      isRolesActive
                        ? "text-blue-600 bg-blue-50/50 font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span>User Roles</span>
                  </Link>
                  <Link
                    href="/admin/user-administration/users"
                    onClick={() => setUserMenuOpen(false)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition ${
                      isUsersActive
                        ? "text-blue-600 bg-blue-50/50 font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Users className="h-4 w-4 text-slate-400" />
                    <span>User Listing</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Linked Employee Account Dropdown */}
            <div className="relative" ref={linkedRef}>
              <button
                type="button"
                onClick={() => {
                  setLinkedMenuOpen(!linkedMenuOpen);
                  setUserMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-bold transition rounded-lg ${
                  isLinkedActive
                    ? "text-blue-600 bg-blue-50/50"
                    : "text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>Linked Employee Account</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {linkedMenuOpen && (
                <div className="absolute left-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <Link
                    href="/admin/user-administration/linked-employees"
                    onClick={() => setLinkedMenuOpen(false)}
                    className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition ${
                      isLinkedActive
                        ? "text-blue-600 bg-blue-50/50 font-bold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <LinkIcon className="h-4 w-4 text-slate-400" />
                    <span>Linked Employee Account</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
