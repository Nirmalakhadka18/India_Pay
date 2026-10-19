const fs = require("fs");
const path = require("path");

const pagePath = path.join(__dirname, "../apps/app/src/app/[locale]/(dashboard)/page.tsx");
let content = fs.readFileSync(pagePath, "utf8");

const startMarker = "// ── Administrator Dashboard (Full Access) ────────────────────────────────────";
const endMarker = "// ── Role 2: Member Dashboard ─────────────────────────────────────────────────";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found! start:", startIndex, "end:", endIndex);
  process.exit(1);
}

const adminDashboardCode = `// ── Role 2: Admin Dashboard (Full Access) ────────────────────────────────────

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
              ? \`\${adminData.pendingLeavesCount} leave(s) awaiting your review\`
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
              ? \`Period: \${adminData.activeRun.periodMonth}\`
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
                  Payroll calculation has been executed. Review and authorize or submit the run to proceed.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Review & Authorize{" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                  This payroll run is submitted and ready for authorization. As an
                  Administrator, you have full authority to review and approve.
                </p>
              </div>
            </div>
            <Link href="/payroll">
              <Button size="sm">
                Review & Authorize{" "}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                  The payroll run is authorized. Finalize the run to lock records
                  and publish payslips.
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

`;

const newContent = content.substring(0, startIndex) + adminDashboardCode + content.substring(endIndex);
fs.writeFileSync(pagePath, newContent, "utf8");
console.log("SUCCESS: Replaced AdminDashboard in page.tsx with original operational layout!");
