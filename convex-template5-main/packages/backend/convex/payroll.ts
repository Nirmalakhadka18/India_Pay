import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

import {
  getDaysInMonth,
  type CalculationContext,
  computeEmployeePayrollItem,
} from "./statutory";

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
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

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

    // Check duplicate run for period
    const existing = await ctx.db
      .query("payrollRuns")
      .withIndex("by_workspace_period", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("periodMonth", args.periodMonth),
      )
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
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

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
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

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

    return {
      workspaceName: workspace.name,
      periodMonth: run.periodMonth,
      startDate: run.startDate,
      endDate: run.endDate,
      paymentDate: run.finalizedAt,
      employeeName: emp
        ? `${emp.firstName} ${emp.lastName}`
        : "Unknown Employee",
      email: emp?.email ?? "",
      department: emp?.department ?? "General",
      designation: emp?.designation ?? "Employee",
      phone: emp?.phone ?? "",
      ...item,
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
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

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
    await requireRole(ctx, userId, args.workspaceId, ["owner"]);

    const run = await ctx.db.get(args.payrollRunId);
    if (!run || run.workspaceId !== args.workspaceId) {
      throw new ConvexError("Payroll run not found");
    }

    if (run.status !== "pending_approval") {
      throw new ConvexError(`Cannot approve run with status ${run.status}`);
    }

    // Strict Two-Person Maker-Checker check
    if (run.submittedBy === userId) {
      throw new ConvexError(
        "You cannot approve a payroll run that you submitted. Another owner must approve it.",
      );
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
    await requireRole(ctx, userId, args.workspaceId, ["owner"]);

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
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

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
