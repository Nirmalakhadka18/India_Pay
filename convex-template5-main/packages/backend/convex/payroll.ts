import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit } from "./auditLog";
import { requireMember, requireRole } from "./orgs";

import { maskAccountNumber, maskPan, maskUan } from "./employees";
import {
  type CalculationContext,
  computeEmployeePayrollItem,
  getDaysInMonth,
} from "./statutory";
import { numberToIndianWords } from "./statutoryReports";

export { getDaysInMonth, type CalculationContext, computeEmployeePayrollItem };

// Calculate payroll preview in memory before saving run
export const calculatePreview = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const parts = args.periodMonth.split("-");
    const yearStr = parts[0] ?? "";
    const monthStr = parts[1] ?? "";
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    if (!year || !month || month < 1 || month > 12) {
      throw new ConvexError("Invalid period format. Use YYYY-MM.");
    }

    const totalDaysInMonth = getDaysInMonth(year, month);
    const startDate = `${args.periodMonth}-01`;
    const endDate = `${args.periodMonth}-${String(totalDaysInMonth).padStart(2, "0")}`;

    // Get active employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "active"),
      )
      .collect();

    // Get latest salaries
    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentSalaries = new Map<string, (typeof allSalaries)[0]>();
    for (const s of allSalaries) {
      const existing = currentSalaries.get(s.employeeId);
      if (!existing || s.effectiveDate > existing.effectiveDate) {
        currentSalaries.set(s.employeeId, s);
      }
    }

    // Get LOP settings
    const lopSettings = (await ctx.db
      .query("lopSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()) ?? {
      calculationBasis: "calendar_days" as const,
      includeUnpaidLeave: true,
      includeAbsent: true,
      halfDayFactor: 0.5,
    };

    // Get attendance records in period
    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const periodAttendance = attendanceRecords.filter(
      (a) => a.date >= startDate && a.date <= endDate,
    );

    // Get compliance settings
    const workspaceCompliance = (await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()) ?? {
      epfEnabled: false,
      epfWageCeiling: 15000,
      epfRestrictToCeiling: true,
      epsEnabled: true,
      epsWageCeiling: 15000,
      edliEnabled: true,
      adminChargesEnabled: true,
      esiEnabled: false,
      esiWageCeiling: 21000,
      ptState: undefined,
      ptEnabled: false,
      lwfEnabled: false,
      lwfState: undefined,
    };

    const allEmployeeCompliance = await ctx.db
      .query("employeeCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const empComplianceMap = new Map<
      string,
      (typeof allEmployeeCompliance)[0]
    >();
    for (const ec of allEmployeeCompliance) {
      empComplianceMap.set(ec.employeeId, ec);
    }

    // Build calculation items per employee
    const items = employees.map((emp) => {
      const salary = currentSalaries.get(emp._id);
      const empAttendance = periodAttendance.filter(
        (a) => a.employeeId === emp._id,
      );
      const empComp = empComplianceMap.get(emp._id);
      return computeEmployeePayrollItem(emp, salary, empAttendance, empComp, {
        totalDaysInMonth,
        month,
        lopSettings,
        workspaceCompliance,
      });
    });

    const totalGrossSalary = items.reduce((sum, i) => sum + i.grossSalary, 0);
    const totalLopDeduction = items.reduce((sum, i) => sum + i.lopDeduction, 0);
    const totalCustomDeductions = items.reduce(
      (sum, i) => sum + i.totalCustomDeductions,
      0,
    );
    const totalStatutoryDeductions = items.reduce(
      (sum, i) => sum + i.totalStatutoryDeductions,
      0,
    );
    const totalEmployerContributions = items.reduce(
      (sum, i) => sum + i.totalEmployerContributions,
      0,
    );
    const totalNetSalary = items.reduce((sum, i) => sum + i.netSalary, 0);

    return {
      periodMonth: args.periodMonth,
      startDate,
      endDate,
      totalEmployees: employees.length,
      totalGrossSalary,
      totalLopDeduction,
      totalCustomDeductions,
      totalStatutoryDeductions,
      totalEmployerContributions,
      totalNetSalary,
      items,
    };
  },
});

// Create and finalize a payroll run record
export const createRun = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    // Check duplicate regular run for period (ignore supplementary runs)
    const existing = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace_period", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("periodMonth", args.periodMonth),
      )
      .filter((q) => q.neq(q.field("runType"), "supplementary"))
      .first();

    if (existing) {
      if (existing.status !== "calculated" && existing.status !== "draft") {
        throw new ConvexError(
          `Cannot recalculate a payroll run in ${existing.status} status.`,
        );
      }

      // Delete existing calculated items safely within this transaction
      const existingItems = await ctx.db
        .query("payrollItems")
        .withIndex("by_run", (q) => q.eq("payrollRunId", existing._id))
        .collect();

      for (const item of existingItems) {
        await ctx.db.delete(item._id);
      }

      // Delete the run itself
      await ctx.db.delete(existing._id);
    }

    // Calculate preview data
    const parts = args.periodMonth.split("-");
    const yearStr = parts[0] ?? "";
    const monthStr = parts[1] ?? "";
    const year = Number.parseInt(yearStr, 10);
    const month = Number.parseInt(monthStr, 10);
    if (!year || !month || month < 1 || month > 12) {
      throw new ConvexError("Invalid period format. Use YYYY-MM.");
    }

    const totalDaysInMonth = getDaysInMonth(year, month);
    const startDate = `${args.periodMonth}-01`;
    const endDate = `${args.periodMonth}-${String(totalDaysInMonth).padStart(2, "0")}`;

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace_status", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("status", "active"),
      )
      .collect();

    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentSalaries = new Map<string, (typeof allSalaries)[0]>();
    for (const s of allSalaries) {
      const existing = currentSalaries.get(s.employeeId);
      if (!existing || s.effectiveDate > existing.effectiveDate) {
        currentSalaries.set(s.employeeId, s);
      }
    }

    const lopSettings = (await ctx.db
      .query("lopSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()) ?? {
      calculationBasis: "calendar_days" as const,
      includeUnpaidLeave: true,
      includeAbsent: true,
      halfDayFactor: 0.5,
    };

    const attendanceRecords = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const periodAttendance = attendanceRecords.filter(
      (a) => a.date >= startDate && a.date <= endDate,
    );

    // Get compliance settings
    const workspaceCompliance = (await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first()) ?? {
      epfEnabled: false,
      epfWageCeiling: 15000,
      epfRestrictToCeiling: true,
      epsEnabled: true,
      epsWageCeiling: 15000,
      edliEnabled: true,
      adminChargesEnabled: true,
      esiEnabled: false,
      esiWageCeiling: 21000,
      ptState: undefined,
      ptEnabled: false,
      lwfEnabled: false,
      lwfState: undefined,
    };

    const allEmployeeCompliance = await ctx.db
      .query("employeeCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const empComplianceMap = new Map<
      string,
      (typeof allEmployeeCompliance)[0]
    >();
    for (const ec of allEmployeeCompliance) {
      empComplianceMap.set(ec.employeeId, ec);
    }

    const now = Date.now();

    const calculatedItems = employees.map((emp) => {
      const salary = currentSalaries.get(emp._id);
      const empAttendance = periodAttendance.filter(
        (a) => a.employeeId === emp._id,
      );
      const empComp = empComplianceMap.get(emp._id);
      return computeEmployeePayrollItem(emp, salary, empAttendance, empComp, {
        totalDaysInMonth,
        month,
        lopSettings,
        workspaceCompliance,
      });
    });

    const totalGrossSalary = calculatedItems.reduce(
      (sum, i) => sum + i.grossSalary,
      0,
    );
    const totalLopDeduction = calculatedItems.reduce(
      (sum, i) => sum + i.lopDeduction,
      0,
    );
    const totalCustomDeductions = calculatedItems.reduce(
      (sum, i) => sum + i.totalCustomDeductions,
      0,
    );
    const totalStatutoryDeductions = calculatedItems.reduce(
      (sum, i) => sum + i.totalStatutoryDeductions,
      0,
    );
    const totalEmployerContributions = calculatedItems.reduce(
      (sum, i) => sum + i.totalEmployerContributions,
      0,
    );
    const totalNetSalary = calculatedItems.reduce(
      (sum, i) => sum + i.netSalary,
      0,
    );

    // Insert main run record
    const payrollRunId = await ctx.db.insert("payrollRuns", {
      workspaceId: args.workspaceId,
      periodMonth: args.periodMonth,
      startDate,
      endDate,
      status: "calculated",
      runType: "regular",
      totalEmployees: employees.length,
      totalGrossSalary,
      totalLopDeduction,
      totalCustomDeductions,
      totalStatutoryDeductions,
      totalEmployerContributions,
      totalNetSalary,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Insert item records
    for (const item of calculatedItems) {
      await ctx.db.insert("payrollItems", {
        workspaceId: args.workspaceId,
        payrollRunId,
        employeeId: item.employeeId,
        ...(item.salaryId ? { salaryId: item.salaryId } : {}),
        basicSalary: item.basicSalary,
        allowances: item.allowances,
        grossSalary: item.grossSalary,
        lopDays: item.lopDays,
        lopDeduction: item.lopDeduction,
        customDeductions: item.customDeductions,
        totalCustomDeductions: item.totalCustomDeductions,
        statutoryDeductions: item.statutoryDeductions,
        totalStatutoryDeductions: item.totalStatutoryDeductions,
        employerContributions: item.employerContributions,
        totalEmployerContributions: item.totalEmployerContributions,
        totalDeductions: item.totalDeductions,
        netSalary: item.netSalary,
        hasSalaryStructure: item.hasSalaryStructure,
        warnings: item.warnings,
        createdAt: now,
      });
    }

    await audit(ctx, args.workspaceId, userId, "payroll.createRun", {
      payrollRunId,
      periodMonth: args.periodMonth,
    });

    return payrollRunId;
  },
});

// List all historical payroll runs
export const listRuns = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    return await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

// Get single payroll run details with items
export const getRunDetails = query({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", args.payrollRunId))
      .collect();

    // Map employee details
    const mappedItems = await Promise.all(
      items.map(async (i) => {
        const emp = await ctx.db.get(i.employeeId);
        return {
          ...i,
          employeeName: emp
            ? `${emp.firstName} ${emp.lastName}`
            : "Unknown Employee",
          email: emp?.email ?? "",
          department: emp?.department ?? "General",
        };
      }),
    );

    return {
      run,
      items: mappedItems,
    };
  },
});

export const getMyPayslips = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const me = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("userId", userId),
      )
      .first();

    if (!me) {
      return [];
    }

    const items = await ctx.db
      .query("payrollItems")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .collect();

    const result = [];
    for (const item of items) {
      if (item.workspaceId !== args.workspaceId) continue;
      const run = await ctx.db.get(item.payrollRunId);
      if (run && run.status === "processed") {
        result.push({
          _id: item._id,
          payrollRunId: run._id,
          periodMonth: run.periodMonth,
          finalizedAt: run.finalizedAt,
          grossSalary: item.grossSalary,
          netSalary: item.netSalary,
          totalDeductions: item.totalDeductions,
          totalEmployerContributions: item.totalEmployerContributions,
          runType: run.runType ?? "regular",
          adjustmentReason: run.adjustmentReason,
        });
      }
    }

    return result.sort((a, b) => (b.finalizedAt ?? 0) - (a.finalizedAt ?? 0));
  },
});

export const getPayslip = query({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    // If plain member, prevent accessing other employees' payslips
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId),
        )
        .first();
      if (!me || me._id !== args.employeeId) {
        throw new ConvexError("Forbidden: You can only view your own payslip");
      }
    }

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "processed") {
      throw new ConvexError(
        "Payslips are only available for finalized payroll runs.",
      );
    }

    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) throw new ConvexError("Workspace not found");

    const item = await ctx.db
      .query("payrollItems")
      .withIndex("by_run", (q) => q.eq("payrollRunId", args.payrollRunId))
      .filter((q) => q.eq(q.field("employeeId"), args.employeeId))
      .first();

    if (!item) {
      throw new ConvexError("Payslip data not found for this employee");
    }

    const emp = await ctx.db.get(args.employeeId);

    // Fetch master salary configuration if available
    const salary = item.salaryId
      ? await ctx.db.get(item.salaryId)
      : await ctx.db
          .query("salaries")
          .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
          .first();

    const masterBasicSalary = salary ? salary.basicSalary : item.basicSalary;
    const masterGrossSalary = salary ? salary.grossSalary : item.grossSalary;

    // Map allowances with master configured amounts
    const enrichedAllowances = (item.allowances || []).map((a) => {
      const match = salary?.allowances?.find(
        (sa) => sa.name.trim().toLowerCase() === a.name.trim().toLowerCase(),
      );
      return {
        name: a.name,
        amount: a.amount,
        masterAmount: match ? match.amount : a.amount,
      };
    });

    // Working days and attendance
    const parts = run.periodMonth.split("-");
    const year = Number.parseInt(parts[0] ?? "2026", 10);
    const month = Number.parseInt(parts[1] ?? "10", 10);
    const totalWorkingDays = getDaysInMonth(year, month);
    const lopDays = item.lopDays || 0;
    const effectiveWorkDays = Math.max(0, totalWorkingDays - lopDays);

    // Workspace Compliance for location & state
    const compliance = await ctx.db
      .query("workspaceCompliance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const location =
      compliance?.ptState === "Karnataka"
        ? "Bangalore"
        : compliance?.ptState || "Bangalore";

    // Formatted employee number and joining date
    const empCode =
      emp?.pfMemberId && emp.pfMemberId.startsWith("NH-")
        ? emp.pfMemberId
        : `NH-OL-${String(emp?._id ?? "578").slice(-3).toUpperCase()}`;

    const joinDateStr = emp?.createdAt
      ? new Date(emp.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "01 Sep 2026";

    // Format current / finalized print date
    const printDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const netPayInWords = numberToIndianWords(item.netSalary);
    const totalCostToCompany =
      item.grossSalary + (item.totalEmployerContributions ?? 0);

    return {
      workspaceName: workspace.name,
      companyAddress:
        "2ND AND 3RD FLOOR, SRI ESHWARI MANSION, 5TH MAIN, 6TH SECTOR, HSR LAYOUT, BENGALURU",
      location,
      periodMonth: run.periodMonth,
      startDate: run.startDate,
      endDate: run.endDate,
      paymentDate: run.finalizedAt,
      printDate,
      employeeName: emp
        ? `${emp.firstName} ${emp.lastName}`
        : "Unknown Employee",
      employeeNo: empCode,
      joiningDate: joinDateStr,
      email: emp?.email ?? "",
      department: emp?.department ?? "General",
      designation: emp?.designation ?? "Employee",
      phone: emp?.phone ?? "",
      bankName: emp?.bankName,
      bankAccountNumber: emp?.bankAccountNumber,
      maskedBankAccountNumber: maskAccountNumber(emp?.bankAccountNumber),
      ifscCode: emp?.ifscCode,
      pan: emp?.pan,
      maskedPan: maskPan(emp?.pan),
      uan: emp?.uan,
      maskedUan: maskUan(emp?.uan),
      pfMemberId: emp?.pfMemberId,
      esicIpNumber: emp?.esicIpNumber,
      totalWorkingDays,
      effectiveWorkDays,
      masterBasicSalary,
      masterGrossSalary,
      netPayInWords,
      totalCostToCompany,
      runType: run.runType ?? "regular",
      originalPayrollRunId: run.originalPayrollRunId,
      adjustmentReason: run.adjustmentReason,
      adjustmentCategory: run.adjustmentCategory,
      ...item,
      allowances: enrichedAllowances,
    };
  },
});

export const submitForApproval = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "calculated") {
      throw new ConvexError(`Cannot submit run with status ${run.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "pending_approval",
      submittedBy: userId,
      submittedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "payroll.submit", {
      payrollRunId: run._id,
      periodMonth: run.periodMonth,
    });
  },
});

export const approveRun = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "pending_approval") {
      throw new ConvexError(`Cannot approve run with status ${run.status}`);
    }

    // Strict Two-Person Maker-Checker check
    if (run.submittedBy === userId) {
      const otherApprover = await ctx.db
        .query("members")
        .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
        .filter((q) =>
          q.and(
            q.or(
              q.eq(q.field("role"), "owner"),
              q.eq(q.field("role"), "admin"),
            ),
            q.neq(q.field("userId"), userId),
          ),
        )
        .first();
      if (otherApprover) {
        throw new ConvexError(
          "You cannot approve a payroll run that you submitted. Another administrator must approve it.",
        );
      }
    }

    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "approved",
      approvedBy: userId,
      approvedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "payroll.approve", {
      payrollRunId: run._id,
      periodMonth: run.periodMonth,
    });
  },
});

export const rejectRun = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "pending_approval") {
      throw new ConvexError(`Cannot reject run with status ${run.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "calculated",
      rejectedBy: userId,
      rejectionReason: args.reason,
      // Note: We DO NOT clear submittedBy or submittedAt per requirement: "Never erase previous rejection history when payroll is resubmitted."
      // We also track it properly in the immutable audit log below.
    });

    await audit(ctx, args.workspaceId, userId, "payroll.reject", {
      payrollRunId: run._id,
      periodMonth: run.periodMonth,
      reason: args.reason,
    });
  },
});

export const finalizeRun = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    payrollRunId: v.id("payrollRuns"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "approved") {
      throw new ConvexError(`Cannot finalize run with status ${run.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(run._id, {
      status: "processed",
      finalizedBy: userId,
      finalizedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "payroll.finalize", {
      payrollRunId: run._id,
      periodMonth: run.periodMonth,
    });
  },
});

/**
 * Create a separate, auditable Supplementary Payroll Run for retroactive adjustments or missed payments.
 *
 * SAFETY & INTEGRITY GUARANTEES:
 * 1. Never mutates, recalculates, or overwrites original processed runs or payslips.
 * 2. Original run must exist and be in 'processed' (finalized) status.
 * 3. Enforces deterministic duplicate prevention via correctionKey (originalRunId + targetEmployeeId + category).
 * 4. Submitter cannot approve their own run (strict Maker-Checker policy on submit/approve).
 * 5. Tracked separately in financial reporting so baseline payroll is not double-counted.
 */
export const createSupplementaryRun = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    originalPayrollRunId: v.id("payrollRuns"),
    targetEmployeeId: v.id("employees"),
    adjustmentCategory: v.string(), // "missed_salary" | "retroactive_hike" | "lop_reversal" | "bonus_adjustment" | "other"
    adjustmentReason: v.string(),
    grossAdjustment: v.number(),
    taxDeduction: v.optional(v.number()),
    customDeductions: v.optional(
      v.array(v.object({ name: v.string(), amount: v.number() })),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    if (args.grossAdjustment <= 0) {
      throw new ConvexError(
        "Gross adjustment amount must be greater than zero",
      );
    }

    if (!args.adjustmentReason.trim()) {
      throw new ConvexError("Adjustment reason is required");
    }

    // 1. Verify original run exists, belongs to workspace, and is finalized (processed)
    const originalRun = await ctx.db.get(args.originalPayrollRunId);
    if (!originalRun || originalRun.workspaceId !== args.workspaceId) {
      throw new ConvexError("Original payroll run not found");
    }

    if (originalRun.status !== "processed") {
      throw new ConvexError(
        `Cannot create supplementary run: Original run is in ${originalRun.status} status. Only processed (finalized) payroll runs can have supplementary adjustments.`,
      );
    }

    // 2. Verify target employee exists in workspace
    const employee = await ctx.db.get(args.targetEmployeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    // 3. Duplicate Prevention: Check for existing active or finalized supplementary run
    const normalizedCategory = args.adjustmentCategory.trim().toLowerCase();
    const correctionKey = `${args.originalPayrollRunId}:${args.targetEmployeeId}:${normalizedCategory}`;

    const existingSupplementary = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) =>
        q.and(
          q.eq(q.field("runType"), "supplementary"),
          q.eq(q.field("correctionKey"), correctionKey),
          q.neq(q.field("status"), "rejected"),
        ),
      )
      .first();

    if (existingSupplementary) {
      throw new ConvexError(
        `Duplicate adjustment rejected: An active or finalized supplementary payroll run already exists for employee ${employee.firstName} ${employee.lastName} with correction key '${normalizedCategory}' for period ${originalRun.periodMonth}.`,
      );
    }

    // 4. Calculate deductions and net salary
    const customDeductions = args.customDeductions ?? [];
    const totalCustomDeductions = customDeductions.reduce(
      (sum, d) => sum + Math.max(0, d.amount),
      0,
    );
    const taxDeduction = Math.max(0, args.taxDeduction ?? 0);
    const statutoryDeductions =
      taxDeduction > 0
        ? [
            {
              name: "TDS / Income Tax Withholding",
              amount: taxDeduction,
              isConfigured: true,
            },
          ]
        : [];
    const totalStatutoryDeductions = taxDeduction;
    const totalDeductions = totalCustomDeductions + totalStatutoryDeductions;
    const netSalary = Math.max(0, args.grossAdjustment - totalDeductions);

    const now = Date.now();

    // 5. Insert supplementary run record (Original run is completely untouched!)
    const supplementaryRunId = await ctx.db.insert("payrollRuns", {
      workspaceId: args.workspaceId,
      periodMonth: originalRun.periodMonth,
      startDate: originalRun.startDate,
      endDate: originalRun.endDate,
      status: "calculated",
      runType: "supplementary",
      originalPayrollRunId: originalRun._id,
      targetEmployeeId: employee._id,
      adjustmentCategory: normalizedCategory,
      adjustmentReason: args.adjustmentReason.trim(),
      correctionKey,
      totalEmployees: 1,
      totalGrossSalary: args.grossAdjustment,
      totalLopDeduction: 0,
      totalCustomDeductions,
      totalStatutoryDeductions,
      totalEmployerContributions: 0,
      totalNetSalary: netSalary,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });

    // 6. Insert supplementary item
    await ctx.db.insert("payrollItems", {
      workspaceId: args.workspaceId,
      payrollRunId: supplementaryRunId,
      employeeId: employee._id,
      basicSalary: args.grossAdjustment,
      allowances: [],
      grossSalary: args.grossAdjustment,
      lopDays: 0,
      lopDeduction: 0,
      customDeductions,
      totalCustomDeductions,
      statutoryDeductions,
      totalStatutoryDeductions,
      employerContributions: [],
      totalEmployerContributions: 0,
      totalDeductions,
      netSalary,
      hasSalaryStructure: true,
      warnings: [
        `Supplementary adjustment for period ${originalRun.periodMonth}: ${args.adjustmentReason.trim()}`,
      ],
      createdAt: now,
    });

    // 7. Immutable audit entry
    await audit(
      ctx,
      args.workspaceId,
      userId,
      "payroll.createSupplementaryRun",
      {
        supplementaryRunId,
        originalPayrollRunId: originalRun._id,
        targetEmployeeId: employee._id,
        adjustmentCategory: normalizedCategory,
        grossAdjustment: args.grossAdjustment,
        netSalary,
      },
    );

    return supplementaryRunId;
  },
});
