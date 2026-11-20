"use client";

import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminDashboardView } from "./admin-dashboard-view";
import { AdminTopbar } from "./admin-topbar";

export default function AdminPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<"welcome" | "dashboard">(
    "welcome",
  );
  const { current, workspaces, isLoading } = useWorkspace();
  const effectiveWorkspaceId = current ?? workspaces[0]?._id;
  const currentWorkspace = workspaces.find(
    (w) => w._id === effectiveWorkspaceId,
  );
  const role = currentWorkspace?.role;
  const isAuthorizedAdmin = role === "owner" || role === "admin";

  // Real-time backend query for all administrative operations (only for authorized admin/owner)
  const adminData = useQuery(
    api.dashboard.adminOperations,
    effectiveWorkspaceId && isAuthorizedAdmin
      ? { workspaceId: effectiveWorkspaceId }
      : "skip",
  );

  const activeCount = adminData?.activeEmployeesCount ?? 33;
  const pendingLeaves = adminData?.pendingLeaves ?? [];

  useEffect(() => {
    if (!isLoading && workspaces.length > 0 && !isAuthorizedAdmin) {
      router.replace("/");
    }
  }, [isLoading, workspaces, isAuthorizedAdmin, router]);

  if (isLoading && workspaces.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-12 text-primary/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!effectiveWorkspaceId) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-12 text-sm text-primary/50">
        Please select a workspace to view the Admin Dashboard.
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center p-8 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8 max-w-md dark:border-red-950 dark:bg-red-950/20">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrative Access Restricted
          </h2>
          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Your account does not have administrator privileges to view this
            portal. Please return to your personal Employee Self-Service
            dashboard.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
            >
              Return to Employee Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white overflow-x-hidden">
      {/* ── Fixed Pixel-Accurate greytHR Header (h: 68px) ── */}
      <AdminTopbar activeView={activeView} onViewChange={setActiveView} />

      {/* ── Tab Container ── */}
      <div className="w-full flex-1 pt-[1px] pb-[10px]">
        {/* Centered Segmented Switcher (Welcome / Dashboard) */}
        <div className="flex justify-center mt-4">
          <ul className="flex items-center rounded-[96px] border border-[rgb(200,211,222)] bg-white p-[4px] shadow-none list-none m-0">
            <li className={activeView === "welcome" ? "active" : ""}>
              <button
                type="button"
                onClick={() => setActiveView("welcome")}
                className={`block rounded-[72px] px-[16px] py-[8px] text-[16px] font-normal leading-normal transition-colors ${
                  activeView === "welcome"
                    ? "bg-[#EDF3FF] text-[#3E5ECA]"
                    : "bg-transparent text-[#5A6A7C] hover:text-slate-900"
                }`}
              >
                Welcome
              </button>
            </li>
            <li className={activeView === "dashboard" ? "active" : ""}>
              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className={`block rounded-[72px] px-[16px] py-[8px] text-[16px] font-normal leading-normal transition-colors ${
                  activeView === "dashboard"
                    ? "bg-[#EDF3FF] text-[#3E5ECA]"
                    : "bg-transparent text-[#5A6A7C] hover:text-slate-900"
                }`}
              >
                Dashboard
              </button>
            </li>
          </ul>
        </div>

        {/* ── Main View Content (padding: 20px 20px 0px) ── */}
        <div className="px-5 pt-5 pb-0">
          {activeView === "welcome" ? (
            <div className="welcome-container w-full">
              {/* 1. Greeting Container (h: 214px, flex between, gap: 32px) */}
              <div className="greeting-container flex items-center justify-between w-full h-[214px] overflow-hidden select-none gap-8">
                {/* Greeting message (w: 637px, pl-6) */}
                <div className="greeting-message pl-6 shrink-0 z-10 w-[637px]">
                  <h1 className="title text-[36px] font-normal leading-[54px] text-[#171E25] m-0 mb-[10px]">
                    Good Morning,
                  </h1>
                  <p className="sub-title text-[18px] font-normal leading-[28px] text-[#5A6A7C] m-0 mb-[10px]">
                    Let&apos;s do great things together. 🚀 🌟
                  </p>
                </div>

                {/* City skyline illustration (w: 1203px, h: 253px, cover 50% 50%) */}
                <div
                  className="image-container w-[1203px] h-[253px] bg-no-repeat bg-cover shrink-0"
                  style={{
                    backgroundImage: "url(/mornig_illustration.svg)",
                    backgroundPosition: "50% 50%",
                  }}
                />
              </div>

              {/* 2. Widget Container (mx: 12px, gap: 27px, w: 1848px) */}
              <div className="widget-container mx-3 mt-0 flex items-start gap-[27px]">
                {/* ── Left Column: Main Container with Morning Gradient (w: 1387px) ── */}
                <div
                  className="main-container w-[1387px] shrink-0 rounded-[12px] p-4"
                  style={{
                    background:
                      "linear-gradient(181deg, rgba(1, 107, 179, 0.1) -11%, rgba(255, 255, 255, 0.1) 27%), linear-gradient(0deg, rgb(255, 255, 255), rgba(237, 237, 237, 0.1)), linear-gradient(0deg, rgb(255, 255, 255), rgba(255, 255, 255, 0.5))",
                  }}
                >
                  {/* A. My Favourites */}
                  <div id="my-favourites" className="w-full">
                    <div className="my-favourites-header h-9 mb-0">
                      <div className="text-[16px] font-semibold text-[#3B4452]">
                        My Favourites
                      </div>
                    </div>

                    <div className="my-favourites-wrapper p-2 flex items-center gap-4">
                      {/* Add Favourite Card (+) */}
                      <button
                        type="button"
                        title="Add Favourite"
                        aria-label="Add Favourite"
                        className="add-favourites flex h-[138px] w-[40px] items-center justify-center rounded-[9px] bg-[#DBE3FF] text-[#3E5ECA] hover:bg-[#C7D4FF] transition shrink-0"
                      >
                        <div
                          className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                          style={{
                            backgroundImage:
                              "url(/plus-secondary-500.svg)",
                          }}
                        />
                      </button>

                      {/* Add Employee Card */}
                      <Link
                        href="/employees"
                        className="newgen-action-item-card group flex h-[138px] w-[131px] flex-col justify-between rounded-[10px] bg-[#DBE3FF] p-2 hover:shadow-xs transition shrink-0"
                      >
                        <div className="top-container flex items-center justify-between">
                          <div
                            className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                            style={{
                              backgroundImage: "url(/user.svg)",
                            }}
                          />
                        </div>
                        <span className="bottom-container text-[14px] font-medium text-[#171E25] leading-tight">
                          Add Employee
                        </span>
                      </Link>

                      {/* Process Payroll Card */}
                      <Link
                        href="/admin/payroll"
                        className="newgen-action-item-card group flex h-[138px] w-[131px] flex-col justify-between rounded-[10px] bg-[#FFF0DE] p-2 hover:shadow-xs transition shrink-0"
                      >
                        <div className="top-container flex items-center justify-between">
                          <div
                            className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                            style={{
                              backgroundImage: "url(/database.svg)",
                            }}
                          />
                        </div>
                        <span className="bottom-container text-[14px] font-medium text-[#171E25] leading-tight">
                          Process Payroll
                        </span>
                      </Link>

                      {/* Update Payroll Data Card */}
                      <Link
                        href="/admin/payroll"
                        className="newgen-action-item-card group flex h-[138px] w-[131px] flex-col justify-between rounded-[10px] bg-[#FFF0DE] p-2 hover:shadow-xs transition shrink-0"
                      >
                        <div className="top-container flex items-center justify-between">
                          <div
                            className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                            style={{
                              backgroundImage: "url(/database.svg)",
                            }}
                          />
                        </div>
                        <span className="bottom-container text-[14px] font-medium text-[#171E25] leading-tight">
                          Update Payroll Data
                        </span>
                      </Link>

                      {/* Salary statement for a month Card */}
                      <Link
                        href="/reports"
                        className="newgen-action-item-card group flex h-[138px] w-[131px] flex-col justify-between rounded-[10px] bg-[#FFF0DE] p-2 hover:shadow-xs transition shrink-0"
                      >
                        <div className="top-container flex items-center justify-between">
                          <div
                            className="h-6 w-6 bg-contain bg-center bg-no-repeat"
                            style={{
                              backgroundImage: "url(/database.svg)",
                            }}
                          />
                        </div>
                        <span className="bottom-container text-[14px] font-medium text-[#171E25] leading-tight">
                          Salary statement for a month
                        </span>
                      </Link>
                    </div>
                  </div>

                  {/* B. My Tasks */}
                  <div className="my-tasks-wrapper w-full mt-9">
                    <div className="mb-3">
                      <div className="text-[16px] font-semibold text-[#3B4452]">
                        My Tasks
                      </div>
                    </div>

                    <div className="my-tasks-list-wrapper flex items-stretch pt-2 pb-5 pl-2">
                      {/* Left Count Container (Peach #FFF0DE, w: 150px, h: 348px) */}
                      <div className="my-tasks-count-container w-[150px] h-[348px] rounded-[12px] bg-[#FFF0DE] p-4 flex flex-col justify-between shrink-0">
                        <div
                          className="newgen-image-tasks h-20 w-20 bg-contain bg-center bg-no-repeat -ml-1.5"
                          style={{
                            backgroundImage: "url(/tasks.svg)",
                          }}
                        />

                        <div className="count-data space-y-4 pb-2">
                          <div className="review-count">
                            <div className="text-[28px] font-semibold text-[#EA580C] leading-none">
                              0
                            </div>
                            <div className="mt-1 text-[12px] text-[#3B4452]">
                              Things to review
                            </div>
                          </div>
                          <div className="moniter-count">
                            <div className="text-[28px] font-semibold text-[#EA580C] leading-none">
                              {pendingLeaves.length > 0
                                ? pendingLeaves.length
                                : 2}
                            </div>
                            <div className="mt-1 text-[12px] text-[#3B4452]">
                              Things to monitor
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Tasks List Container with Border (w: 1132px, h: 348px) */}
                      <div className="my-tasks-list-container w-[1132px] h-[348px] rounded-[11px] border border-[#E4E9F0] ml-3 flex flex-col justify-between overflow-hidden">
                        {/* Task Item (h: 74px) */}
                        <div className="my-individual-task flex items-center justify-between my-2 pr-10 h-[74px]">
                          <div className="flex items-stretch gap-4 h-full">
                            <div className="legend w-[3px] rounded-[8px] bg-[#1AB89B] shrink-0" />
                            <div className="task-info-container py-2.5 flex flex-col justify-center">
                              <div className="text-[14px] font-semibold text-[#3B4452]">
                                Leave
                              </div>
                              <div className="text-[13px] text-[#94A3B8]">
                                {pendingLeaves.length > 0
                                  ? `${pendingLeaves.length} tasks pending for others’ review.`
                                  : "2 tasks pending for others’ review."}
                              </div>
                            </div>
                          </div>
                          <Link
                            href="/leave"
                            className="text-[14px] font-medium text-[#3E5ECA] hover:underline"
                          >
                            Monitor
                          </Link>
                        </div>

                        {/* Official greytHR Helpdesk Graphic (w: 1130px, h: 152px) */}
                        <div
                          className="newgen-image-helpdesk h-[152px] w-full bg-cover bg-bottom bg-no-repeat select-none pointer-events-none"
                          style={{
                            backgroundImage: "url(/helpdesk.svg)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right Column: Latest Updates Panel (w: 434px, h: 434px) ── */}
                <div className="latest-updates-container w-[434px] h-[434px] shrink-0 rounded-[12px] bg-[#FCF2FF] p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="text-[16px] font-semibold text-[#3B4452]">
                        Latest Updates
                      </div>
                      <Link
                        href="/compliance"
                        className="text-slate-500 hover:text-purple-600 transition"
                      >
                        <svg
                          stroke="currentColor"
                          fill="none"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </Link>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[8px] bg-[#F5E3FA] p-2">
                        <div className="text-[11px] font-normal text-[#94A3B8] mb-2">
                          13 Nov 2026
                        </div>
                        <h3 className="text-[13px] font-normal text-[#3B4452] leading-snug">
                          Pay Late Inputs in the Same Month with Supplementary
                          Payroll in greytHR
                        </h3>
                      </div>

                      <div className="rounded-[8px] bg-[#F5E3FA] p-2">
                        <div className="text-[11px] font-normal text-[#94A3B8] mb-2">
                          05 Nov 2026
                        </div>
                        <h3 className="text-[13px] font-normal text-[#3B4452] leading-snug">
                          Migrate Past Performance Review Ratings and Documents to
                          greytHR PMS
                        </h3>
                      </div>

                      <div className="rounded-[8px] bg-[#F5E3FA] p-2">
                        <div className="text-[11px] font-normal text-[#94A3B8] mb-2">
                          02 Nov 2026
                        </div>
                        <h3 className="text-[13px] font-normal text-[#3B4452] leading-snug">
                          Track Daily Hours by Project with Timesheets Daily
                          Summary Report in greytHR
                        </h3>
                      </div>

                      <div className="rounded-[8px] bg-[#F5E3FA] p-2">
                        <div className="text-[11px] font-normal text-[#94A3B8] mb-2">
                          30 Oct 2026
                        </div>
                        <h3 className="text-[13px] font-normal text-[#3B4452] leading-snug">
                          People, Processes &amp; What’s on HR’s Radar
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ── View 2: Exact greytHR CEO Operational Analytics Dashboard Canvas ── */
            <div className="w-full">
              <AdminDashboardView activeCount={activeCount} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
