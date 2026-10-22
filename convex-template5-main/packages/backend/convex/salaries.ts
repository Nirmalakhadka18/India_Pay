import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

export const listByEmployee = query({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    // If plain member, restrict to only viewing their own salary history
    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        .first();
      if (!me || me._id !== args.employeeId) {
        throw new ConvexError("Forbidden: You cannot view another employee's salary structure");
      }
    }

    return await ctx.db
      .query("salaries")
      .withIndex("by_employee_date", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .collect();
  },
});

export const getCurrentSalaries = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    // Fetch all salaries for the workspace
    const allSalaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Group by employee and get latest
    const currentSalaries = new Map<string, typeof allSalaries[0]>();
    for (const salary of allSalaries) {
      const existing = currentSalaries.get(salary.employeeId);
      if (!existing || salary.effectiveDate > existing.effectiveDate) {
        currentSalaries.set(salary.employeeId, salary);
      }
    }
    return Array.from(currentSalaries.values());
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    basicSalary: v.number(),
    allowances: v.array(v.object({ name: v.string(), amount: v.number() })),
    deductions: v.array(v.object({ name: v.string(), amount: v.number() })),
    effectiveDate: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    if (args.basicSalary < 0) throw new ConvexError("Basic salary cannot be negative");

    for (const a of args.allowances) {
      if (a.amount < 0) throw new ConvexError(`Allowance ${a.name} cannot have a negative amount`);
    }
    for (const d of args.deductions) {
      if (d.amount < 0) throw new ConvexError(`Deduction ${d.name} cannot have a negative amount`);
    }

    const totalAllowances = args.allowances.reduce((sum, a) => sum + a.amount, 0);
    const grossSalary = args.basicSalary + totalAllowances;

    const salaryId = await ctx.db.insert("salaries", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      basicSalary: args.basicSalary,
      allowances: args.allowances,
      deductions: args.deductions,
      grossSalary,
      effectiveDate: args.effectiveDate,
      createdAt: Date.now(),
    });

    await audit(ctx, args.workspaceId, userId, "salary.add", { employeeId: args.employeeId, salaryId });
    return salaryId;
  },
});
