import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

// Helper to check days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export interface CalculationContext {
  totalDaysInMonth: number;
  month: number;
  lopSettings: {
    calculationBasis: "calendar_days" | "fixed_30_days" | "working_days";
    includeUnpaidLeave: boolean;
    includeAbsent: boolean;
    halfDayFactor: number;
  };
  workspaceCompliance: {
    epfEnabled: boolean;
    epfWageCeiling?: number;
    epfRestrictToCeiling?: boolean;
    epsEnabled?: boolean;
    epsWageCeiling?: number;
    edliEnabled?: boolean;
    adminChargesEnabled?: boolean;
    esiEnabled: boolean;
    esiWageCeiling?: number;
    ptEnabled: boolean;
    ptState?: string;
  };
}

// Statutory payroll computation engine for Indian payroll rules
export function computeEmployeePayrollItem(
  emp: {
    _id: any;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  },
  salary: any | undefined,
  empAttendance: { status: string }[],
  empComp: any | undefined,
  calcCtx: CalculationContext
) {
  const warnings: string[] = [];
  let basicSalary = 0;
  let allowances: { name: string; amount: number }[] = [];
  let customDeductions: { name: string; amount: number }[] = [];
  let grossSalary = 0;
  let hasSalaryStructure = true;

  if (!salary) {
    hasSalaryStructure = false;
    warnings.push("Missing salary structure. Gross salary set to ₹0.");
  } else {
    basicSalary = Math.max(0, salary.basicSalary || 0);
    allowances = salary.allowances ?? [];
    customDeductions = salary.deductions ?? [];
    grossSalary = Math.max(0, salary.grossSalary || 0);
  }

  // 1. Loss of Pay (LOP) calculation
  let lopDays = 0;
  for (const rec of empAttendance) {
    if (rec.status === "absent" && calcCtx.lopSettings.includeAbsent) {
      lopDays += 1;
    } else if (rec.status === "unpaid_leave" && calcCtx.lopSettings.includeUnpaidLeave) {
      lopDays += 1;
    } else if (rec.status === "half_day") {
      lopDays += calcCtx.lopSettings.halfDayFactor;
    }
  }

  let dailyRate = 0;
  if (calcCtx.lopSettings.calculationBasis === "calendar_days") {
    dailyRate = calcCtx.totalDaysInMonth > 0 ? grossSalary / calcCtx.totalDaysInMonth : 0;
  } else if (calcCtx.lopSettings.calculationBasis === "fixed_30_days") {
    dailyRate = grossSalary / 30;
  } else {
    dailyRate = calcCtx.totalDaysInMonth > 0 ? grossSalary / calcCtx.totalDaysInMonth : 0;
  }

  const lopDeduction = Math.round(lopDays * dailyRate);
  const totalCustomDeductions = customDeductions.reduce((sum, d) => sum + d.amount, 0);

  // 2. Statutory EPF / EPS / EDLI / Admin calculations
  // Statutory wage ceiling under EPF Act 1952 is ₹15,000/month (configurable per workspace)
  const isEpfOptOut = empComp?.epfOptOut ?? false;
  const isEpfEnabled = calcCtx.workspaceCompliance.epfEnabled && !isEpfOptOut;

  let epfEmployee = 0;
  let epfEmployer = 0;
  let epsEmployer = 0;
  let edliEmployer = 0;
  let adminChargesEmployer = 0;

  if (isEpfEnabled) {
    const wageCeiling = calcCtx.workspaceCompliance.epfWageCeiling ?? 15000;
    const restrictToCeiling = calcCtx.workspaceCompliance.epfRestrictToCeiling ?? true;
    const voluntaryActualBasic = empComp?.epfOnActualBasic ?? false;

    // Eligible wage determination:
    // If voluntary actual basic is elected (by employee or workspace), use full basicSalary;
    // otherwise enforce statutory wage ceiling.
    const eligibleWage = (voluntaryActualBasic || !restrictToCeiling)
      ? basicSalary
      : Math.min(basicSalary, wageCeiling);

    // Employee EPF: 12% of eligible wage
    epfEmployee = Math.round(eligibleWage * 0.12);

    // Employer EPS: 8.33% subject to statutory EPS ceiling (default ₹15,000, capping EPS at ₹1,250)
    const isEpsEnabled = calcCtx.workspaceCompliance.epsEnabled ?? true;
    const epsCeiling = calcCtx.workspaceCompliance.epsWageCeiling ?? 15000;
    if (isEpsEnabled) {
      const epsEligibleWage = Math.min(eligibleWage, epsCeiling);
      // Under EPFO rules, 8.33% of 15000 = 1249.50, officially rounded to 1,250
      epsEmployer = Math.min(1250, Math.round(epsEligibleWage * 0.0833));
    }

    // Employer EPF share: remainder of 12% employer PF after deducting EPS
    const totalEmployerPf = Math.round(eligibleWage * 0.12);
    epfEmployer = Math.max(0, totalEmployerPf - epsEmployer);

    // EDLI: 0.5% (capped at ₹15,000 wage ceiling -> max ₹75/month)
    const isEdliEnabled = calcCtx.workspaceCompliance.edliEnabled ?? true;
    if (isEdliEnabled) {
      const edliEligibleWage = Math.min(eligibleWage, 15000);
      edliEmployer = Math.min(75, Math.round(edliEligibleWage * 0.005));
    }

    // EPFO Admin charges: 0.5%
    const isAdminEnabled = calcCtx.workspaceCompliance.adminChargesEnabled ?? true;
    if (isAdminEnabled) {
      adminChargesEmployer = Math.round(eligibleWage * 0.005);
    }
  }

  // 3. ESI calculation
  let esiEmployee = 0;
  let esiEmployer = 0;
  const esiCeiling = calcCtx.workspaceCompliance.esiWageCeiling ?? 21000;
  if (calcCtx.workspaceCompliance.esiEnabled && grossSalary > 0 && grossSalary <= esiCeiling) {
    esiEmployee = Math.ceil(grossSalary * 0.0075);
    esiEmployer = Math.ceil(grossSalary * 0.0325);
  }

  // 4. Professional Tax (Karnataka state slabs)
  let ptAmount = 0;
  if (calcCtx.workspaceCompliance.ptEnabled && calcCtx.workspaceCompliance.ptState === "Karnataka") {
    if (grossSalary >= 25000) {
      // Karnataka PT is ₹300 in February, ₹200 in all other months
      ptAmount = calcCtx.month === 2 ? 300 : 200;
    }
  }

  // 5. TDS: Manual monthly override (No automated tax regime slab engine)
  const tdsOverride = empComp?.tdsOverride;
  const tdsAmount = Math.max(0, tdsOverride ?? 0);

  // Line items
  const statutoryDeductions = [
    { name: "PF (Provident Fund - 12%)", amount: epfEmployee, isConfigured: isEpfEnabled },
    { name: "ESI (Employee State Insurance - 0.75%)", amount: esiEmployee, isConfigured: calcCtx.workspaceCompliance.esiEnabled },
    { name: "Professional Tax (PT)", amount: ptAmount, isConfigured: calcCtx.workspaceCompliance.ptEnabled },
    { name: "TDS (Manual Override - Non-automated)", amount: tdsAmount, isConfigured: true },
  ];
  const totalStatutoryDeductions = epfEmployee + esiEmployee + ptAmount + tdsAmount;

  const employerContributions = [
    { name: "Employer EPF (3.67% share)", amount: epfEmployer, isConfigured: isEpfEnabled },
    { name: "Employer EPS (8.33% Pension, capped at ₹1,250)", amount: epsEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.epsEnabled ?? true) },
    { name: "EDLI (0.5% Insurance)", amount: edliEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.edliEnabled ?? true) },
    { name: "EPFO Admin Charges (0.5%)", amount: adminChargesEmployer, isConfigured: isEpfEnabled && (calcCtx.workspaceCompliance.adminChargesEnabled ?? true) },
    { name: "Employer ESI (3.25%)", amount: esiEmployer, isConfigured: calcCtx.workspaceCompliance.esiEnabled },
  ];
  const totalEmployerContributions =
    epfEmployer + epsEmployer + edliEmployer + adminChargesEmployer + esiEmployer;

  const totalDeductions = lopDeduction + totalCustomDeductions + totalStatutoryDeductions;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    employeeId: emp._id,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    department: emp.department ?? "General",
    ...(salary ? { salaryId: salary._id } : {}),
    basicSalary,
    allowances,
    grossSalary,
    lopDays,
    lopDeduction,
    customDeductions,
    totalCustomDeductions,
    statutoryDeductions,
    totalStatutoryDeductions,
    employerContributions,
    totalEmployerContributions,
    totalDeductions,
    netSalary,
    hasSalaryStructure,
    warnings,
  };
}

// Calculate payroll preview in memory before saving run
export const calculatePreview = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

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
        q.eq("workspaceId", args.workspaceId).eq("status", "active")
      )
      .collect();

    // Get latest salaries
    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentSalaries = new Map<string, typeof allSalaries[0]>();
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
      (a) => a.date >= startDate && a.date <= endDate
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

    const empComplianceMap = new Map<string, typeof allEmployeeCompliance[0]>();
    for (const ec of allEmployeeCompliance) {
      empComplianceMap.set(ec.employeeId, ec);
    }

    // Build calculation items per employee
    const items = employees.map((emp) => {
      const salary = currentSalaries.get(emp._id);
      const empAttendance = periodAttendance.filter((a) => a.employeeId === emp._id);
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
      0
    );
    const totalStatutoryDeductions = items.reduce((sum, i) => sum + i.totalStatutoryDeductions, 0);
    const totalEmployerContributions = items.reduce((sum, i) => sum + i.totalEmployerContributions, 0);
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
        q.eq("workspaceId", args.workspaceId).eq("periodMonth", args.periodMonth)
      )
      .first();

    if (existing) {
      if (existing.status !== "calculated" && existing.status !== "draft") {
        throw new ConvexError(
          `Cannot recalculate a payroll run in ${existing.status} status.`
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
        q.eq("workspaceId", args.workspaceId).eq("status", "active")
      )
      .collect();

    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentSalaries = new Map<string, typeof allSalaries[0]>();
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
      (a) => a.date >= startDate && a.date <= endDate
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

    const empComplianceMap = new Map<string, typeof allEmployeeCompliance[0]>();
    for (const ec of allEmployeeCompliance) {
      empComplianceMap.set(ec.employeeId, ec);
    }

    const now = Date.now();

    const calculatedItems = employees.map((emp) => {
      const salary = currentSalaries.get(emp._id);
      const empAttendance = periodAttendance.filter((a) => a.employeeId === emp._id);
      const empComp = empComplianceMap.get(emp._id);
      return computeEmployeePayrollItem(emp, salary, empAttendance, empComp, {
        totalDaysInMonth,
        month,
        lopSettings,
        workspaceCompliance,
      });
    });

    const totalGrossSalary = calculatedItems.reduce((sum, i) => sum + i.grossSalary, 0);
    const totalLopDeduction = calculatedItems.reduce((sum, i) => sum + i.lopDeduction, 0);
    const totalCustomDeductions = calculatedItems.reduce((sum, i) => sum + i.totalCustomDeductions, 0);
    const totalStatutoryDeductions = calculatedItems.reduce((sum, i) => sum + i.totalStatutoryDeductions, 0);
    const totalEmployerContributions = calculatedItems.reduce((sum, i) => sum + i.totalEmployerContributions, 0);
    const totalNetSalary = calculatedItems.reduce((sum, i) => sum + i.netSalary, 0);

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
    await requireMember(ctx, userId, args.workspaceId);

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
    await requireMember(ctx, userId, args.workspaceId);

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
          employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
          email: emp?.email ?? "",
          department: emp?.department ?? "General",
        };
      })
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
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
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
          q.eq("workspaceId", args.workspaceId).eq("userId", userId)
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
      throw new ConvexError("Payslips are only available for finalized payroll runs.");
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
      paymentDate: run.finalizedAt,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown Employee",
      email: emp?.email ?? "",
      department: emp?.department ?? "General",
      designation: emp?.designation ?? "Employee",
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
      throw new ConvexError("You cannot approve a payroll run that you submitted. Another owner must approve it.");
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
