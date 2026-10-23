"use client";

import { PayslipModal } from "@/components/payslip-modal";
import { useWorkspace } from "@/lib/useWorkspace";
import { api } from "@v1/backend/convex/_generated/api";
import type { Id } from "@v1/backend/convex/_generated/dataModel";
import { Button } from "@v1/ui/button";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileText,
  Layers,
  Loader2,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ── Shared Stat Card ─────────────────────────────────────────────────────────

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        highlight
          ? "border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary/60">
          <Icon className="h-4 w-4" />
          <span className="text-xs uppercase tracking-wide font-medium">
            {label}
          </span>
        </div>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-primary">
        {value ?? "—"}
      </p>
      {sub && <p className="mt-1 text-xs text-primary/50">{sub}</p>}
    </div>
  );
}

// ── Role 2: Admin Dashboard (Full Access) ────────────────────────────────────

function AdminDashboard({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
  const adminData = useQuery(api.dashboard.adminOperations, { workspaceId });
  const audit = useQuery(api.audit.recent, { workspaceId });

  return (
    <div className="space-y-6">
      {/* Header with Admin Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-primary">
              Admin Operations Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Users className="h-3.5 w-3.5 text-blue-500" />
              Workspace Administrator
            </span>
          </div>
          <p className="text-sm text-primary/60">
            Operational human resources, attendance logs, leave reviews, and
            payroll calculation.
          </p>
        </div>
      </div>

      {/* KPI Cards: Operational metrics tailored for HR Admin */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Users}
          label="Active Employees"
          value={adminData ? adminData.activeEmployeesCount : "—"}
          sub="Managed in directory"
        />
        <Stat
          icon={CalendarClock}
          label="Pending Leave Reviews"
          value={adminData ? adminData.pendingLeavesCount : "—"}
          sub={
            adminData && adminData.pendingLeavesCount > 0
              ? `${adminData.pendingLeavesCount} leave(s) awaiting your review`
              : "All leave requests reviewed"
          }
          highlight={Boolean(adminData && adminData.pendingLeavesCount > 0)}
        />
        <Stat
          icon={Banknote}
          label="Payroll Status"
          value={
            adminData?.activeRun
              ? adminData.activeRun.status.replace("_", " ").toUpperCase()
              : "NO RUN"
          }
          sub={
            adminData?.activeRun
              ? `Period: ${adminData.activeRun.periodMonth}`
              : "Ready to create next run"
          }
        />
        <Stat
          icon={CheckCircle2}
          label="Monthly Attendance"
          value={adminData ? adminData.currentMonthAttendanceCount : "—"}
          sub="Punches tracked this month"
        />
      </div>

      {/* Operational Workflow Status Callouts */}
      {adminData?.activeRun?.status === "calculated" ? (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Calculated Payroll Ready for Review (
                  {adminData.activeRun.periodMonth})
                </h3>
                <p className="text-xs text-primary/70 mt-1">
                  Payroll calculation has been executed. Review and authorize or
                  submit the run to proceed.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Review & Authorize <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : adminData?.activeRun?.status === "pending_approval" ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Payroll Awaiting Authorization (
                  {adminData.activeRun.periodMonth})
                </h3>
                <p className="text-xs text-primary/70 mt-1">
                  This payroll run is submitted and ready for authorization. As
                  an Administrator, you have full authority to review and
                  approve.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Review & Authorize <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : adminData?.activeRun?.status === "approved" ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-primary">
                  Payroll Approved — Ready to Finalize (
                  {adminData.activeRun.periodMonth})
                </h3>
                <p className="text-xs text-primary/70 mt-1">
                  The payroll run is authorized. Finalize the run to lock
                  records and publish payslips.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Finalize Payroll Run{" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Pending Leave Requests Queue */}
      {adminData?.pendingLeaves && adminData.pendingLeaves.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-medium text-primary">
                Pending Leave Requests to Review
              </h2>
            </div>
            <Link
              href="/attendance"
              className="text-xs text-primary/60 hover:text-primary transition"
            >
              View all in Attendance →
            </Link>
          </div>
          <div className="divide-y divide-border/50">
            {adminData.pendingLeaves.map((l) => (
              <div
                key={l._id}
                className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-primary">
                    {l.employeeName}
                  </p>
                  <p className="text-xs text-primary/50 mt-0.5">
                    {l.startDate} to {l.endDate} ({l.daysCount} days) •{" "}
                    <span className="capitalize">{l.leaveType} Leave</span>
                  </p>
                  {l.reason && (
                    <p className="text-xs text-primary/70 italic mt-1">
                      &quot;{l.reason}&quot;
                    </p>
                  )}
                </div>
                <Link href="/attendance">
                  <Button variant="secondary" size="sm">
                    Review Request
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operational Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/payroll"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Calculate Payroll
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Prepare & submit monthly run
          </p>
        </Link>
        <Link
          href="/employees"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Add Employee
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Onboard new team members
          </p>
        </Link>
        <Link
          href="/attendance"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Review Leaves
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Approve or reject requests
          </p>
        </Link>
        <Link
          href="/salaries"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-primary/40 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-primary">
            Salary Structures
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Update employee CTC
          </p>
        </Link>
      </div>

      {/* Operational Activity Feed */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Activity className="h-4 w-4 text-primary/50" />
          <h2 className="text-sm font-medium text-primary">
            Operational Activity
          </h2>
        </div>
        <div className="divide-y divide-border/50">
          {audit === undefined ? (
            <div className="px-4 py-6 text-sm text-primary/40">Loading…</div>
          ) : audit.length ? (
            audit.slice(0, 8).map((a) => (
              <div
                key={a._id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="font-mono text-xs font-medium text-primary/80">
                  {a.action}
                </span>
                <span className="text-xs text-primary/50">
                  {new Date(a.at).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-sm text-primary/40">
              No recent activity.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Role 2: Member Dashboard ─────────────────────────────────────────────────

function MemberDashboard({ workspaceId }: { workspaceId: Id<"workspaces"> }) {
  const memberData = useQuery(api.dashboard.memberSummary, { workspaceId });
  const user = useQuery(api.users.getUser);
  const linkMyAccount = useMutation(api.employees.linkMyAccount);

  const [linkState, setLinkState] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const [linkError, setLinkError] = useState("");
  const [selectedPayslipRunId, setSelectedPayslipRunId] = useState<
    string | null
  >(null);

  const payslipData = useQuery(
    api.payroll.getPayslip,
    workspaceId && selectedPayslipRunId && memberData?.employee
      ? {
          workspaceId,
          payrollRunId: selectedPayslipRunId as Id<"payrollRuns">,
          employeeId: memberData.employee._id,
        }
      : "skip",
  );

  const isLinked = Boolean(memberData?.isLinked && memberData?.employee);
  const balances = useQuery(
    api.leaves.getLeaveBalances,
    workspaceId && isLinked ? { workspaceId } : "skip",
  );

  const handleLink = async () => {
    setLinkState("loading");
    setLinkError("");
    try {
      await linkMyAccount({ workspaceId });
      setLinkState("success");
    } catch (e) {
      setLinkState("error");
      setLinkError((e as Error).message || "Failed to link account");
    }
  };

  if (!memberData) {
    return (
      <div className="flex h-64 w-full items-center justify-center text-primary/40">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const data = memberData;
  const employee = data.employee;

  // State A: Account Not Linked
  if (!data.isLinked || !employee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Employee Self-Service Portal
          </h1>
          <p className="text-sm text-primary/60">
            Personal portal for payslips, leaves, and attendance.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-8 text-center max-w-lg mx-auto">
          <UserCircle className="mx-auto h-12 w-12 text-primary/30 mb-4" />
          <h2 className="text-lg font-semibold text-primary mb-2">
            Account Not Linked
          </h2>
          <p className="text-sm text-primary/60 mb-6">
            Your login account ({user?.email ?? "current user"}) is not yet
            linked to an employee profile in this workspace. Link your account
            to securely view your salary slips, request leaves, and review
            attendance records.
          </p>

          {linkState === "error" && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive text-left space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{linkError.replace("ConvexError: ", "")}</span>
              </div>
              {linkError.includes("No employee record found") && (
                <p className="pl-6 text-xs text-destructive/80">
                  Please ask your workspace administrator to add or update your
                  employee profile with email: {user?.email}
                </p>
              )}
            </div>
          )}

          {linkState === "success" ? (
            <div className="mb-4 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Successfully linked!
              Refreshing your portal...
            </div>
          ) : (
            <Button onClick={handleLink} disabled={linkState === "loading"}>
              {linkState === "loading" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Link My Account
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { latestPayslip, attendanceCurrentMonth } = data;

  // State B: Linked Account with Authorized Personal Data
  return (
    <div className="space-y-6">
      {/* Header with Employee Role Badge & Joining Date */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-primary">
              Welcome back, {employee.firstName} {employee.lastName}
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
              Member
            </span>
          </div>
          <p className="text-xs text-primary/60 mt-1">
            Emp ID: <span className="font-mono font-medium text-primary">#{("employeeIdNumber" in employee && typeof employee.employeeIdNumber === "string" ? employee.employeeIdNumber : (employee._id ? employee._id.slice(-6).toUpperCase() : "EMP"))}</span> • {employee.designation || "Employee"} •{" "}
            {employee.department || "General"} • Joined{" "}
            {"joiningDate" in employee &&
            typeof employee.joiningDate === "string" &&
            !Number.isNaN(new Date(employee.joiningDate).getTime())
              ? new Date(employee.joiningDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recently"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/leave">
            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
              Apply Leave
            </Button>
          </Link>
          <Link href="/salary">
            <Button size="sm" variant="outline" className="text-xs">
              My Payslips
            </Button>
          </Link>
        </div>
      </div>

      {/* HR Announcement Notice */}
      <div className="rounded-md border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <p className="font-semibold text-primary">IndiaPay HR Announcement</p>
          <p className="text-primary/70 mt-0.5">
            Statutory tax declarations (Form 12BB) for the financial year are accessible under Document Center. Ensure your direct payout bank IFSC details are up to date under My Salary.
          </p>
        </div>
      </div>

      {/* Personal KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Latest Net Salary"
          value={
            latestPayslip
              ? `₹${(latestPayslip.netSalary ?? 0).toLocaleString("en-IN")}`
              : "—"
          }
          sub={
            latestPayslip
              ? `Period: ${latestPayslip.periodMonth}`
              : "No finalized payslips yet"
          }
        />
        <Stat
          icon={CalendarClock}
          label="Casual Leave Balance"
          value={balances ? `${balances.casual.balance} Days` : "—"}
          sub={balances ? `${balances.casual.consumed} consumed of ${balances.casual.granted}` : "Granted by policy"}
        />
        <Stat
          icon={CalendarClock}
          label="Sick Leave Balance"
          value={balances ? `${balances.sick.balance} Days` : "—"}
          sub={balances ? `${balances.sick.consumed} consumed of ${balances.sick.granted}` : "Granted by policy"}
        />
        <Stat
          icon={CheckCircle2}
          label="Attendance This Month"
          value={`${attendanceCurrentMonth?.presentDays ?? 0} Days`}
          sub={`${attendanceCurrentMonth?.halfDays ?? 0} half-days, ${attendanceCurrentMonth?.absentDays ?? 0} absent`}
        />
      </div>

      {/* Two Column Section: Personal Payslips & Leave History */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column: Recent Payslips */}
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-semibold text-primary">
                My Recent Payslips
              </h2>
            </div>
            <Link
              href="/salary"
              className="text-xs text-cyan-600 hover:underline font-medium transition"
            >
              View all in Salary →
            </Link>
          </div>
          {data.recentPayslips.length === 0 ? (
            <div className="p-8 text-center text-sm text-primary/40">
              No finalized salary slips available yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Period</th>
                  <th className="px-4 py-2.5 font-medium">Net Salary</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.recentPayslips.map((p) => (
                  <tr key={p._id} className="hover:bg-muted/40 transition">
                    <td className="px-4 py-3 font-semibold text-primary">
                      {p.periodMonth}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      ₹{(p.netSalary ?? 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedPayslipRunId(p.payrollRunId)}
                        className="text-xs"
                      >
                        View Slip <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Recent Leave Requests */}
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary/50" />
              <h2 className="text-sm font-semibold text-primary">
                My Leave Requests
              </h2>
            </div>
            <Link
              href="/leave"
              className="text-xs text-cyan-600 hover:underline font-medium transition"
            >
              Go to Leave Hub →
            </Link>
          </div>
          {data.recentLeaves.length === 0 ? (
            <div className="p-8 text-center text-sm text-primary/40">
              No leave requests submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {data.recentLeaves.map((l) => (
                <div
                  key={l._id}
                  className="flex items-center justify-between p-3.5"
                >
                  <div>
                    <p className="text-xs font-semibold text-primary capitalize">
                      {l.leaveType} Leave ({l.daysCount} days)
                    </p>
                    <p className="text-[11px] text-primary/50 font-mono">
                      {l.startDate} to {l.endDate}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      l.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : l.status === "rejected"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/leave"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-cyan-500/50 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-cyan-600">
            Apply Leave
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Casual, Sick, or Earned off
          </p>
        </Link>
        <Link
          href="/salary"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-emerald-500/50 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-emerald-600">
            My Salary & Slips
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Download PDF payslips
          </p>
        </Link>
        <Link
          href="/people"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-blue-500/50 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-blue-600">
            People Directory
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Find colleagues & teams
          </p>
        </Link>
        <Link
          href="/helpdesk"
          className="group rounded-lg border border-border bg-card p-3.5 text-left transition hover:border-indigo-500/50 hover:bg-muted/40"
        >
          <p className="text-xs font-semibold text-primary group-hover:text-indigo-600">
            HR Helpdesk
          </p>
          <p className="text-[11px] text-primary/50 mt-0.5">
            Support tickets & queries
          </p>
        </Link>
      </div>

      {/* Payslip Modal for PDF view & download */}
      <PayslipModal
        open={Boolean(selectedPayslipRunId)}
        onOpenChange={(open) => !open && setSelectedPayslipRunId(null)}
        payslip={payslipData}
        isLoading={selectedPayslipRunId !== null && !payslipData}
      />
    </div>
  );
}

// ── Main Dashboard Router Component ──────────────────────────────────────────

export default function Home() {
  const { current, workspaces, isLoading: wsLoading } = useWorkspace();

  if (wsLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-primary/40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="flex h-full w-full items-center justify-center p-12 text-sm text-primary/50">
        Please select a workspace from the sidebar.
      </div>
    );
  }

  const currentWorkspace = workspaces.find((w) => w._id === current);
  const role = currentWorkspace?.role;

  return (
    <div className="flex h-full w-full bg-secondary px-6 py-8 dark:bg-black">
      <div className="mx-auto w-full max-w-screen-xl">
        {role === "member" ? (
          <MemberDashboard workspaceId={current} />
        ) : (
          <AdminDashboard workspaceId={current} />
        )}
      </div>
    </div>
  );
}
