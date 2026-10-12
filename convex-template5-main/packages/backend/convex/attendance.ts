import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

const ATTENDANCE_STATUS = v.union(
  v.literal("present"),
  v.literal("absent"),
  v.literal("half_day"),
  v.literal("paid_leave"),
  v.literal("unpaid_leave")
);

// List attendance records by workspace and date range or employee
export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.optional(v.string()), // "YYYY-MM-DD"
    endDate: v.optional(v.string()),   // "YYYY-MM-DD"
    employeeId: v.optional(v.id("employees")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    if (m.role === "member") {
      const me = await ctx.db
        .query("employees")
        .withIndex("by_workspace_user", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("userId", userId)
        )
        .first();
      if (!me) return [];
      if (args.employeeId && args.employeeId !== me._id) {
        throw new ConvexError("Forbidden: You cannot view another employee's attendance records");
      }
      const records = await ctx.db
        .query("attendance")
        .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
        .order("desc")
        .collect();
      return records.filter((r) => {
        if (args.startDate && r.date < args.startDate) return false;
        if (args.endDate && r.date > args.endDate) return false;
        return true;
      });
    }

    if (args.employeeId) {
      const records = await ctx.db
        .query("attendance")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!))
        .order("desc")
        .collect();

      return records.filter((r) => {
        if (args.startDate && r.date < args.startDate) return false;
        if (args.endDate && r.date > args.endDate) return false;
        return true;
      });
    }

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    return records.filter((r) => {
      if (args.startDate && r.date < args.startDate) return false;
      if (args.endDate && r.date > args.endDate) return false;
      return true;
    });
  },
});

// Summary for a date range (Restricted to HR / Admin / Owner)
export const summary = query({
  args: {
    workspaceId: v.id("workspaces"),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(),   // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const filtered = records.filter(
      (r) => r.date >= args.startDate && r.date <= args.endDate
    );

    const stats = {
      totalRecords: filtered.length,
      present: 0,
      absent: 0,
      halfDay: 0,
      paidLeave: 0,
      unpaidLeave: 0,
    };

    for (const r of filtered) {
      if (r.status === "present") stats.present++;
      else if (r.status === "absent") stats.absent++;
      else if (r.status === "half_day") stats.halfDay++;
      else if (r.status === "paid_leave") stats.paidLeave++;
      else if (r.status === "unpaid_leave") stats.unpaidLeave++;
    }

    return stats;
  },
});

// Mark/Update attendance record (Single day per employee)
export const mark = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    date: v.string(), // "YYYY-MM-DD"
    status: ATTENDANCE_STATUS,
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    // Check existing
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_employee_date", (q) =>
        q.eq("employeeId", args.employeeId).eq("date", args.date)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        checkInTime: args.checkInTime,
        checkOutTime: args.checkOutTime,
        remarks: args.remarks,
        updatedAt: now,
      });
      await audit(ctx, args.workspaceId, userId, "attendance.update", {
        attendanceId: existing._id,
        employeeId: args.employeeId,
        date: args.date,
        status: args.status,
      });
      return existing._id;
    }

    const attendanceId = await ctx.db.insert("attendance", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      date: args.date,
      status: args.status,
      checkInTime: args.checkInTime,
      checkOutTime: args.checkOutTime,
      remarks: args.remarks,
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "attendance.create", {
      attendanceId,
      employeeId: args.employeeId,
      date: args.date,
      status: args.status,
    });

    return attendanceId;
  },
});

export const getMyAttendance = query({
  args: {
    workspaceId: v.id("workspaces"),
    periodMonth: v.string(), // "YYYY-MM"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const me = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .first();

    if (!me) return [];

    const startDate = `${args.periodMonth}-01`;
    const endDate = `${args.periodMonth}-31`;

    const records = await ctx.db
      .query("attendance")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("workspaceId"), args.workspaceId),
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    return records.sort((a, b) => a.date.localeCompare(b.date));
  },
});
