import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";
import { isSalaryNewer } from "./salaries";

const CALC_BASIS = v.union(
  v.literal("calendar_days"),
  v.literal("fixed_30_days"),
  v.literal("working_days")
);

export const getSettings = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const settings = await ctx.db
      .query("lopSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    if (!settings) {
      // Default LOP policy for India Pay if not configured yet
      return {
        calculationBasis: "calendar_days" as const,
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
        updatedAt: Date.now(),
      };
    }

    return settings;
  },
});

export const updateSettings = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    calculationBasis: CALC_BASIS,
    includeUnpaidLeave: v.boolean(),
    includeAbsent: v.boolean(),
    halfDayFactor: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const existing = await ctx.db
      .query("lopSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        calculationBasis: args.calculationBasis,
        includeUnpaidLeave: args.includeUnpaidLeave,
        includeAbsent: args.includeAbsent,
        halfDayFactor: args.halfDayFactor,
        updatedAt: now,
      });
      await audit(ctx, args.workspaceId, userId, "lop.updateSettings", {
        settingsId: existing._id,
      });
      return existing._id;
    }

    const settingsId = await ctx.db.insert("lopSettings", {
      workspaceId: args.workspaceId,
      calculationBasis: args.calculationBasis,
      includeUnpaidLeave: args.includeUnpaidLeave,
      includeAbsent: args.includeAbsent,
      halfDayFactor: args.halfDayFactor,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "lop.createSettings", {
      settingsId,
    });
    return settingsId;
  },
});

export const calculateLOP = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(),   // "YYYY-MM-DD"
    daysInPeriod: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const settings = await ctx.db
      .query("lopSettings")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .first() ?? {
        calculationBasis: "calendar_days" as const,
        includeUnpaidLeave: true,
        includeAbsent: true,
        halfDayFactor: 0.5,
      };

    // Fetch all attendance for workspace
    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const inRangeAttendance = attendance.filter(
      (a) => a.date >= args.startDate && a.date <= args.endDate
    );

    // Fetch latest employee salaries
    const salaries = await ctx.db
      .query("salaries")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const currentSalaries = new Map<string, typeof salaries[0]>();
    for (const s of salaries) {
      const existing = currentSalaries.get(s.employeeId);
      if (!existing || isSalaryNewer(s, existing)) {
        currentSalaries.set(s.employeeId, s);
      }
    }

    // Calculate per employee LOP days and deduction amount
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const results = employees.map((emp) => {
      const empAttendance = inRangeAttendance.filter((a) => a.employeeId === emp._id);
      let lopDays = 0;

      for (const record of empAttendance) {
        if (record.status === "absent" && settings.includeAbsent) {
          lopDays += 1;
        } else if (record.status === "unpaid_leave" && settings.includeUnpaidLeave) {
          lopDays += 1;
        } else if (record.status === "half_day") {
          lopDays += settings.halfDayFactor;
        }
      }

      const salary = currentSalaries.get(emp._id);
      const gross = salary?.grossSalary ?? 0;

      let dailyRate = 0;
      if (settings.calculationBasis === "calendar_days") {
        dailyRate = args.daysInPeriod > 0 ? gross / args.daysInPeriod : 0;
      } else if (settings.calculationBasis === "fixed_30_days") {
        dailyRate = gross / 30;
      } else {
        dailyRate = args.daysInPeriod > 0 ? gross / args.daysInPeriod : 0;
      }

      const deductionAmount = Math.round(lopDays * dailyRate);

      return {
        employeeId: emp._id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        grossSalary: gross,
        lopDays,
        dailyRate: Math.round(dailyRate),
        deductionAmount,
      };
    });

    return {
      settings,
      period: { startDate: args.startDate, endDate: args.endDate },
      employeeSummary: results,
    };
  },
});
