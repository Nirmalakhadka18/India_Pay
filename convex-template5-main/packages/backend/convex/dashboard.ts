import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "./_generated/server";
import { readCounters } from "./counters";
import { requireMember, requireRole } from "./orgs";

/** Workspace overview for the executive dashboard — O(1) via maintained counters.
 * RESTRICTED: Only Workspace Owners and Administrators can query company-wide stats.
 * Plain members are strictly forbidden.
 */
export const stats = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, periodMonth }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const m = await requireRole(ctx, userId, workspaceId, ["admin"]);
    const c = await readCounters(ctx, workspaceId);
    // usage rows are few per workspace (one per metric) — a small scan is fine.
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_workspace_metric", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const usageTotal = usage.reduce((n, u) => n + (u.count ?? 0), 0);

    // Active employees count
    const activeEmployees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "active"),
      )
      .collect();

    // Persisted payroll runs for workspace
    const runs = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();

    // Qualifying runs are approved or processed (finalized) regular runs.
    // Exclude draft, calculated, pending_approval (submitted), rejected, and supplementary runs
    // to preserve baseline monthly totals without distortion or double-counting.
    const qualifyingRuns = runs.filter(
      (r) =>
        (r.status === "approved" || r.status === "processed") &&
        r.runType !== "supplementary",
    );

    const supplementaryRuns = runs.filter(
      (r) =>
        r.runType === "supplementary" &&
        (r.status === "approved" || r.status === "processed"),
    );

    let selectedRun: (typeof runs)[0] | null = null;
    if (periodMonth) {
      // Find qualifying run for the requested period, prioritizing processed over approved and latest createdAt
      const periodRuns = qualifyingRuns
        .filter((r) => r.periodMonth === periodMonth)
        .sort((a, b) => {
          if (a.status === "processed" && b.status !== "processed") return -1;
          if (b.status === "processed" && a.status !== "processed") return 1;
          return b.createdAt - a.createdAt;
        });
      selectedRun = periodRuns[0] ?? null;
    } else {
      // Pick the latest qualifying period
      if (qualifyingRuns.length > 0) {
        qualifyingRuns.sort((a, b) => {
          const pComp = b.periodMonth.localeCompare(a.periodMonth);
          if (pComp !== 0) return pComp;
          if (a.status === "processed" && b.status !== "processed") return -1;
          if (b.status === "processed" && a.status !== "processed") return 1;
          return b.createdAt - a.createdAt;
        });
        selectedRun = qualifyingRuns[0] ?? null;
      }
    }

    const pendingRuns = runs.filter(
      (r) => r.status === "pending_approval",
    ).length;

    // Pending leaves
    const pendingLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "pending"),
      )
      .collect();

    const latestAnyRun = runs.length > 0 ? runs[0] : null;

    return {
      role: m.role,
      jobs: c.jobs ?? 0,
      openJobs: c.openJobs ?? 0,
      members: c.members ?? 0,
      files: c.files ?? 0,
      usageTotal,
      activeEmployeesCount: activeEmployees.length,
      latestGrossPayroll: selectedRun ? selectedRun.totalGrossSalary : null,
      latestNetPayroll: selectedRun ? selectedRun.totalNetSalary : null,
      latestEmployeeDeductions: selectedRun
        ? (selectedRun.totalStatutoryDeductions ?? 0) +
          (selectedRun.totalCustomDeductions ?? 0) +
          (selectedRun.totalLopDeduction ?? 0)
        : null,
      latestEmployerContributions: selectedRun
        ? selectedRun.totalEmployerContributions ?? 0
        : null,
      latestPeriod: selectedRun ? selectedRun.periodMonth : null,
      latestPayrollStatus: selectedRun ? selectedRun.status : null,
      availablePeriods: Array.from(
        new Set(qualifyingRuns.map((r) => r.periodMonth)),
      )
        .sort()
        .reverse(),
      supplementaryRunsCount: supplementaryRuns.length,
      supplementaryGrossTotal: supplementaryRuns.reduce(
        (sum, r) => sum + r.totalGrossSalary,
        0,
      ),
      supplementaryNetTotal: supplementaryRuns.reduce(
        (sum, r) => sum + r.totalNetSalary,
        0,
      ),
      pendingApprovalsCount: pendingRuns + pendingLeaves.length,
      pendingPayrollRunsCount: pendingRuns,
      pendingLeavesCount: pendingLeaves.length,
      latestRun: latestAnyRun
        ? {
            _id: latestAnyRun._id,
            periodMonth: latestAnyRun.periodMonth,
            status: latestAnyRun.status,
            totalGrossSalary: latestAnyRun.totalGrossSalary,
            totalNetSalary: latestAnyRun.totalNetSalary,
            totalEmployees: latestAnyRun.totalEmployees,
            submittedBy: latestAnyRun.submittedBy,
            approvedBy: latestAnyRun.approvedBy,
          }
        : null,
      qualifyingRun: selectedRun
        ? {
            _id: selectedRun._id,
            periodMonth: selectedRun.periodMonth,
            status: selectedRun.status,
            totalGrossSalary: selectedRun.totalGrossSalary,
            totalNetSalary: selectedRun.totalNetSalary,
            totalEmployees: selectedRun.totalEmployees,
            totalStatutoryDeductions: selectedRun.totalStatutoryDeductions,
            totalCustomDeductions: selectedRun.totalCustomDeductions,
            totalLopDeduction: selectedRun.totalLopDeduction,
            totalEmployeeDeductions:
              (selectedRun.totalStatutoryDeductions ?? 0) +
              (selectedRun.totalCustomDeductions ?? 0) +
              (selectedRun.totalLopDeduction ?? 0),
            totalEmployerContributions:
              selectedRun.totalEmployerContributions ?? 0,
            submittedBy: selectedRun.submittedBy,
            approvedBy: selectedRun.approvedBy,
            finalizedAt: selectedRun.finalizedAt,
          }
        : null,
      canApprovePayroll: m.role === "owner" || m.role === "admin",
    };
  },
});

/** Operational summary for Workspace Administrators.
 * RESTRICTED: Only Workspace Owners and Administrators can query operational data.
 * Plain members are strictly forbidden.
 */
export const adminOperations = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const m = await requireRole(ctx, userId, workspaceId, ["admin"]);

    const activeEmployees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "active"),
      )
      .collect();

    const pendingLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "pending"),
      )
      .order("desc")
      .collect();

    const enrichedPendingLeaves = await Promise.all(
      pendingLeaves.slice(0, 5).map(async (l) => {
        const emp = await ctx.db.get(l.employeeId);
        return {
          _id: l._id,
          employeeId: l.employeeId,
          employeeName: emp
            ? `${emp.firstName} ${emp.lastName}`
            : "Unknown Employee",
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          daysCount: l.daysCount,
          reason: l.reason,
          createdAt: l.createdAt,
        };
      }),
    );

    const runs = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();

    const runsAwaitingSubmission = runs.filter(
      (r) => r.status === "calculated" || r.status === "draft",
    ).length;

    const runsAwaitingOwnerApproval = runs.filter(
      (r) => r.status === "pending_approval",
    ).length;

    const runsAwaitingFinalization = runs.filter(
      (r) => r.status === "approved",
    ).length;

    const latestRun = runs.length > 0 ? runs[0] : null;

    // Current month attendance count
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const allAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    const currentMonthAttendance = allAttendance.filter((a) =>
      a.date.startsWith(currentMonthStr),
    );

    return {
      role: m.role,
      activeEmployeesCount: activeEmployees.length,
      pendingLeavesCount: pendingLeaves.length,
      pendingLeaves: enrichedPendingLeaves,
      currentMonthAttendanceCount: currentMonthAttendance.length,
      runsAwaitingSubmission,
      runsAwaitingOwnerApproval,
      runsAwaitingFinalization,
      canApprovePayroll: true, // Admin has full approval rights
      activeRun: latestRun
        ? {
            _id: latestRun._id,
            periodMonth: latestRun.periodMonth,
            status: latestRun.status,
            totalEmployees: latestRun.totalEmployees,
            totalGrossSalary: latestRun.totalGrossSalary,
            totalNetSalary: latestRun.totalNetSalary,
          }
        : null,
    };
  },
});

/** Personal self-service portal overview for regular Users/Members.
 * SECURITY: Only returns personal data for the authenticated user's linked employee record.
 * Never leaks company-wide financial figures, company employee totals, or other employees' data.
 */
export const memberSummary = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, { workspaceId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    await requireMember(ctx, userId, workspaceId);

    const emp = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", workspaceId).eq("userId", userId),
      )
      .first();

    if (!emp) {
      return {
        isLinked: false,
        employee: null,
        latestPayslip: null,
        totalPayslipsCount: 0,
        pendingLeavesCount: 0,
        totalLeavesCount: 0,
        attendanceCurrentMonth: {
          presentDays: 0,
          absentDays: 0,
          halfDays: 0,
          totalLogged: 0,
          periodMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
        },
        recentPayslips: [],
        recentLeaves: [],
      };
    }

    // Get personal payslips (only processed runs)
    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
      .collect();

    const finalizedPayslips = [];
    for (const item of items) {
      if (item.workspaceId !== workspaceId) continue;
      const run = await ctx.db.get(item.payrollRunId);
      if (run && run.status === "processed") {
        finalizedPayslips.push({
          _id: item._id,
          payrollRunId: run._id,
          periodMonth: run.periodMonth,
          finalizedAt: run.finalizedAt,
          grossSalary: item.grossSalary,
          netSalary: item.netSalary,
          totalDeductions: item.totalDeductions,
        });
      }
    }
    finalizedPayslips.sort(
      (a, b) => (b.finalizedAt ?? 0) - (a.finalizedAt ?? 0),
    );

    // Get personal leaves
    const myLeaves = await ctx.db
      .query("leaveRequests")
      .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
      .order("desc")
      .collect();

    const pendingLeaves = myLeaves.filter((l) => l.status === "pending");

    // Get personal attendance for current month
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const myAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_employee", (q) => q.eq("employeeId", emp._id))
      .collect();

    const monthAttendance = myAttendance.filter(
      (a) =>
        a.workspaceId === workspaceId && a.date.startsWith(currentMonthStr),
    );

    const presentDays = monthAttendance.filter(
      (a) => a.status === "present" || a.status === "paid_leave",
    ).length;
    const absentDays = monthAttendance.filter(
      (a) => a.status === "absent" || a.status === "unpaid_leave",
    ).length;
    const halfDays = monthAttendance.filter(
      (a) => a.status === "half_day",
    ).length;

    return {
      isLinked: true,
      employee: {
        _id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        status: emp.status,
      },
      latestPayslip: finalizedPayslips.length > 0 ? finalizedPayslips[0] : null,
      totalPayslipsCount: finalizedPayslips.length,
      pendingLeavesCount: pendingLeaves.length,
      totalLeavesCount: myLeaves.length,
      attendanceCurrentMonth: {
        presentDays,
        absentDays,
        halfDays,
        totalLogged: monthAttendance.length,
        periodMonth: currentMonthStr,
      },
      recentPayslips: finalizedPayslips.slice(0, 5),
      recentLeaves: myLeaves.slice(0, 5).map((l) => ({
        _id: l._id,
        leaveType: l.leaveType,
        startDate: l.startDate,
        endDate: l.endDate,
        daysCount: l.daysCount,
        status: l.status,
        reason: l.reason,
        reviewRemarks: l.reviewRemarks,
      })),
    };
  },
});

/** Complete Executive Intelligence Overview for Workspace Owners.
 * RESTRICTED: Only Workspace Owners and Administrators can query this.
 */
export const ownerExecutiveSummary = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.optional(v.string()),
  },
  handler: async (ctx, { workspaceId, periodMonth }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const m = await requireRole(ctx, userId, workspaceId, ["admin"]);

    // Active employees
    const activeEmployees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", workspaceId).eq("status", "active"),
      )
      .collect();

    // All payroll runs
    const runs = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .collect();

    const qualifyingRuns = runs
      .filter(
        (r) =>
          (r.status === "approved" || r.status === "processed") &&
          r.runType !== "supplementary",
      )
      .sort((a, b) => {
        const pComp = b.periodMonth.localeCompare(a.periodMonth);
        if (pComp !== 0) return pComp;
        if (a.status === "processed" && b.status !== "processed") return -1;
        if (b.status === "processed" && a.status !== "processed") return 1;
        return b.createdAt - a.createdAt;
      });

    const availablePeriods = Array.from(
      new Set(qualifyingRuns.map((r) => r.periodMonth)),
    )
      .sort()
      .reverse();

    let selectedRun: (typeof runs)[0] | null = null;
    if (periodMonth) {
      const match = qualifyingRuns.find((r) => r.periodMonth === periodMonth);
      selectedRun = match ?? null;
    } else if (qualifyingRuns.length > 0) {
      selectedRun = qualifyingRuns[0] ?? null;
    }

    // Supplementary runs
    const supplementaryRuns = runs.filter((r) => r.runType === "supplementary");

    // Pending runs
    const pendingRuns = runs.filter((r) => r.status === "pending_approval");
    const enrichedPendingRuns = await Promise.all(
      pendingRuns.map(async (r) => {
        const submitter = r.submittedBy
          ? await ctx.db.get(r.submittedBy)
          : null;
        return {
          _id: r._id,
          periodMonth: r.periodMonth,
          runType: r.runType ?? "regular",
          totalEmployees: r.totalEmployees,
          totalGrossSalary: r.totalGrossSalary,
          totalNetSalary: r.totalNetSalary,
          submittedAt: r.submittedAt ?? r.createdAt,
          submittedBy: r.submittedBy,
          submitterName:
            submitter?.name ?? submitter?.email ?? "Unknown Submitter",
          submitterEmail: submitter?.email ?? "unknown@company.com",
          isSubmitter: r.submittedBy === userId,
          canApprove:
            (m.role === "owner" || m.role === "admin") &&
            r.submittedBy !== userId,
          adjustmentReason: r.adjustmentReason,
        };
      }),
    );

    // Breakdown & employee reconciliation for selected run
    let epfTotal = 0;
    let esiTotal = 0;
    let tdsTotal = 0;
    let ptTotal = 0;
    let employerEpfTotal = 0;
    let employerEsiTotal = 0;
    const includedEmpIds = new Set<string>();

    if (selectedRun) {
      const items = await ctx.db
        .query("payrollItems")
        .withIndex("by_run", (q) => q.eq("payrollRunId", selectedRun._id))
        .collect();

      for (const item of items) {
        includedEmpIds.add(item.employeeId);

        // Statutory deductions
        for (const sd of item.statutoryDeductions ?? []) {
          const name = sd.name.toUpperCase();
          if (name.includes("PT") || name.includes("PROFESSIONAL"))
            ptTotal += sd.amount;
          else if (name.includes("PF") || name.includes("EPF"))
            epfTotal += sd.amount;
          else if (name.includes("ESI")) esiTotal += sd.amount;
          else if (
            name.includes("TDS") ||
            name.includes("INCOME TAX") ||
            name === "TAX"
          )
            tdsTotal += sd.amount;
        }

        // Employer contributions
        for (const ec of item.employerContributions ?? []) {
          const name = ec.name.toUpperCase();
          if (
            name.includes("PF") ||
            name.includes("EPF") ||
            name.includes("EPS") ||
            name.includes("EDLI")
          )
            employerEpfTotal += ec.amount;
          else if (name.includes("ESI")) employerEsiTotal += ec.amount;
        }
      }
    }

    // Workforce Reconciliation
    const unincludedEmployees = selectedRun
      ? activeEmployees
          .filter((e) => !includedEmpIds.has(e._id))
          .map((e) => ({
            _id: e._id,
            name: `${e.firstName} ${e.lastName}`,
            email: e.email,
            department: e.department ?? "General",
            designation: e.designation ?? "Employee",
            joinedAt: e.createdAt,
          }))
      : [];

    // Compliance settings
    const workspaceCompliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .first();

    const selectedPeriodStr =
      selectedRun?.periodMonth ?? periodMonth ?? "2026-10";
    const [periodY, periodM] = selectedPeriodStr.split("-").map(Number);

    // Calculate official deadlines based on selected period
    let nextEpfDeadline = "15th of following month";
    let nextEsiDeadline = "15th of following month";
    let nextTdsChallanDeadline = "7th of following month";
    let nextPtDeadline = "20th of following month";
    let nextTdsReturnDeadline = "Quarterly Form 24Q";

    if (periodY && periodM) {
      const nextMonth = periodM === 12 ? 1 : periodM + 1;
      const nextYear = periodM === 12 ? periodY + 1 : periodY;
      const nextMStr = String(nextMonth).padStart(2, "0");
      nextEpfDeadline = `15-${nextMStr}-${nextYear} (Central - EPFO ECR)`;
      nextEsiDeadline = `15-${nextMStr}-${nextYear} (Central - ESIC Return)`;
      nextTdsChallanDeadline = `07-${nextMStr}-${nextYear} (Central - ITNS 281)`;

      const ptState = workspaceCompliance?.ptState ?? "Karnataka";
      if (ptState === "Maharashtra") {
        const lastDay = new Date(nextYear, nextMonth, 0).getDate();
        nextPtDeadline = `${String(lastDay).padStart(2, "0")}-${nextMStr}-${nextYear} (State Jurisdiction: Maharashtra)`;
      } else if (ptState === "Telangana" || ptState === "Andhra Pradesh") {
        nextPtDeadline = `10-${nextMStr}-${nextYear} (State Jurisdiction: ${ptState})`;
      } else {
        nextPtDeadline = `20-${nextMStr}-${nextYear} (State Jurisdiction: ${ptState})`;
      }

      if (periodM >= 4 && periodM <= 6)
        nextTdsReturnDeadline = `31-07-${periodY} (Q1 Form 24Q)`;
      else if (periodM >= 7 && periodM <= 9)
        nextTdsReturnDeadline = `31-10-${periodY} (Q2 Form 24Q)`;
      else if (periodM >= 10 && periodM <= 12)
        nextTdsReturnDeadline = `31-01-${periodY + 1} (Q3 Form 24Q)`;
      else if (periodM >= 1 && periodM <= 3)
        nextTdsReturnDeadline = `31-05-${periodY} (Q4 Form 24Q)`;
    }

    const statutoryCompliance = {
      epf: {
        enabled: workspaceCompliance?.epfEnabled ?? false,
        wageCeiling: workspaceCompliance?.epfWageCeiling ?? 15000,
        statutoryRate: "12% Employee + 12% Employer",
        jurisdiction: "Central (EPFO)",
        filingDeadline: nextEpfDeadline,
        periodDeduction: epfTotal,
        periodEmployerContribution: employerEpfTotal,
        status: workspaceCompliance?.epfEnabled
          ? ("active" as const)
          : ("disabled" as const),
      },
      esi: {
        enabled: workspaceCompliance?.esiEnabled ?? false,
        wageCeiling: workspaceCompliance?.esiWageCeiling ?? 21000,
        statutoryRate: "0.75% Employee + 3.25% Employer",
        jurisdiction: "Central (ESIC)",
        filingDeadline: nextEsiDeadline,
        periodDeduction: esiTotal,
        periodEmployerContribution: employerEsiTotal,
        status: workspaceCompliance?.esiEnabled
          ? ("active" as const)
          : ("disabled" as const),
      },
      tds: {
        enabled: true,
        section: "Section 192 (Salaries)",
        jurisdiction: "Central (CBDT)",
        challanDeadline: nextTdsChallanDeadline,
        returnDeadline: nextTdsReturnDeadline,
        periodDeduction: tdsTotal,
        status: "active" as const,
      },
      pt: {
        enabled: workspaceCompliance?.ptEnabled ?? false,
        state: workspaceCompliance?.ptState ?? "Karnataka",
        jurisdiction: `State Jurisdiction (${workspaceCompliance?.ptState ?? "Karnataka"})`,
        filingDeadline: nextPtDeadline,
        periodDeduction: ptTotal,
        status: workspaceCompliance?.ptEnabled
          ? ("active" as const)
          : ("disabled" as const),
      },
    };

    // Business Insights: Monthly trends across recent qualifying runs (deduplicated per month, up to 6)
    const distinctPeriodMap = new Map<string, (typeof qualifyingRuns)[0]>();
    for (const r of qualifyingRuns) {
      if (!distinctPeriodMap.has(r.periodMonth)) {
        distinctPeriodMap.set(r.periodMonth, r);
      }
    }
    const chronologicalRuns = Array.from(distinctPeriodMap.values()).sort(
      (a, b) => a.periodMonth.localeCompare(b.periodMonth),
    );
    const recentTrendRuns = chronologicalRuns.slice(-6);
    const monthlyTrends = recentTrendRuns.map((r) => ({
      _id: r._id,
      periodMonth: r.periodMonth,
      gross: r.totalGrossSalary,
      net: r.totalNetSalary,
      employerContributions: r.totalEmployerContributions ?? 0,
      totalEmployerCost:
        r.totalGrossSalary + (r.totalEmployerContributions ?? 0),
      employees: r.totalEmployees,
      status: r.status,
    }));

    // MoM comparison for selectedRun
    let momChange = {
      grossDiff: 0,
      grossPercent: 0,
      netDiff: 0,
      netPercent: 0,
      employeeDiff: 0,
      prevPeriod: null as string | null,
    };

    if (selectedRun) {
      const idx = chronologicalRuns.findIndex(
        (r) => r.periodMonth === selectedRun.periodMonth,
      );
      if (idx > 0) {
        const prev = chronologicalRuns[idx - 1]!;
        const gDiff = selectedRun.totalGrossSalary - prev.totalGrossSalary;
        const nDiff = selectedRun.totalNetSalary - prev.totalNetSalary;
        momChange = {
          grossDiff: gDiff,
          grossPercent:
            prev.totalGrossSalary > 0
              ? Number(((gDiff / prev.totalGrossSalary) * 100).toFixed(1))
              : 0,
          netDiff: nDiff,
          netPercent:
            prev.totalNetSalary > 0
              ? Number(((nDiff / prev.totalNetSalary) * 100).toFixed(1))
              : 0,
          employeeDiff: selectedRun.totalEmployees - prev.totalEmployees,
          prevPeriod: prev.periodMonth,
        };
      }
    }

    const totalEmployeeDeductions = selectedRun
      ? (selectedRun.totalStatutoryDeductions ?? 0) +
        (selectedRun.totalCustomDeductions ?? 0) +
        (selectedRun.totalLopDeduction ?? 0)
      : 0;

    const totalEmployerContributions =
      selectedRun?.totalEmployerContributions ?? 0;
    const totalCompanyCost = selectedRun
      ? selectedRun.totalGrossSalary + totalEmployerContributions
      : 0;

    const avgGrossPerEmployee =
      selectedRun && selectedRun.totalEmployees > 0
        ? Math.round(selectedRun.totalGrossSalary / selectedRun.totalEmployees)
        : 0;

    const avgNetPerEmployee =
      selectedRun && selectedRun.totalEmployees > 0
        ? Math.round(selectedRun.totalNetSalary / selectedRun.totalEmployees)
        : 0;

    const employerBurdenRatio =
      selectedRun && selectedRun.totalGrossSalary > 0
        ? Number(
            (
              (totalEmployerContributions / selectedRun.totalGrossSalary) *
              100
            ).toFixed(2),
          )
        : 0;

    // Supplementary adjustments enriched list
    const enrichedSupplementary = await Promise.all(
      supplementaryRuns.slice(0, 10).map(async (sr) => {
        let empName = "Workforce";
        if (sr.targetEmployeeId) {
          const emp = await ctx.db.get(sr.targetEmployeeId);
          if (emp) empName = `${emp.firstName} ${emp.lastName}`;
        }
        return {
          _id: sr._id,
          periodMonth: sr.periodMonth,
          targetEmployeeName: empName,
          adjustmentReason: sr.adjustmentReason ?? "Retroactive Adjustment",
          adjustmentCategory: sr.adjustmentCategory ?? "correction",
          totalGrossSalary: sr.totalGrossSalary,
          totalNetSalary: sr.totalNetSalary,
          status: sr.status,
          createdAt: sr.createdAt,
        };
      }),
    );

    // Recent enriched audit logs (10)
    const recentAuditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .order("desc")
      .take(10);

    const enrichedAudit = await Promise.all(
      recentAuditLogs.map(async (l) => {
        const u = await ctx.db.get(l.userId);
        return {
          _id: l._id,
          action: l.action,
          at: l.at,
          userName: u?.name ?? u?.email ?? "System User",
          userEmail: u?.email ?? "unknown@company.com",
          meta: l.meta,
        };
      }),
    );

    return {
      role: m.role,
      isOwner: m.role === "owner" || m.role === "admin",
      financialOverview: {
        selectedPeriod: selectedRun?.periodMonth ?? null,
        status: selectedRun?.status ?? null,
        gross: selectedRun?.totalGrossSalary ?? 0,
        net: selectedRun?.totalNetSalary ?? 0,
        employeeDeductions: totalEmployeeDeductions,
        employerContributions: totalEmployerContributions,
        totalCompanyCost,
        employeesCount: selectedRun?.totalEmployees ?? 0,
        finalizedAt: selectedRun?.finalizedAt ?? null,
        breakdown: {
          epf: epfTotal,
          esi: esiTotal,
          tds: tdsTotal,
          pt: ptTotal,
          employerEpf: employerEpfTotal,
          employerEsi: employerEsiTotal,
        },
      },
      workforceReconciliation: {
        activeEmployeesCount: activeEmployees.length,
        finalizedEmployeesCount: selectedRun?.totalEmployees ?? 0,
        difference: activeEmployees.length - (selectedRun?.totalEmployees ?? 0),
        hasVariance: Boolean(
          selectedRun && activeEmployees.length !== selectedRun.totalEmployees,
        ),
        unincludedEmployees,
        auditExplanation:
          unincludedEmployees.length > 0
            ? `${unincludedEmployees.length} active employee(s) joined or were registered in the workspace after the ${selectedRun?.periodMonth} payroll run was locked.`
            : "All active employees are accounted for in the selected payroll run.",
      },
      statutoryCompliance,
      payrollApprovals: {
        pendingRunsCount: enrichedPendingRuns.length,
        pendingRuns: enrichedPendingRuns,
        canApproveAny:
          (m.role === "owner" || m.role === "admin") &&
          enrichedPendingRuns.some((r) => r.canApprove),
      },
      businessInsights: {
        monthlyTrends,
        momChange,
        avgGrossPerEmployee,
        avgNetPerEmployee,
        employerBurdenRatio,
      },
      supplementaryPayroll: {
        count: supplementaryRuns.length,
        grossTotal: supplementaryRuns.reduce(
          (sum, r) => sum + r.totalGrossSalary,
          0,
        ),
        netTotal: supplementaryRuns.reduce(
          (sum, r) => sum + r.totalNetSalary,
          0,
        ),
        runs: enrichedSupplementary,
      },
      auditActivity: enrichedAudit,
      availablePeriods,
    };
  },
});
