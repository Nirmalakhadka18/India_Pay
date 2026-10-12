import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

const LEAVE_TYPE = v.union(
  v.literal("casual"),
  v.literal("sick"),
  v.literal("earned"),
  v.literal("unpaid")
);

const LEAVE_STATUS = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("cancelled")
);

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(LEAVE_STATUS),
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
        throw new ConvexError("Forbidden: You cannot view another employee's leave requests");
      }
      const records = await ctx.db
        .query("leaveRequests")
        .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
        .order("desc")
        .collect();
      if (args.status) return records.filter((r) => r.status === args.status);
      return records;
    }

    if (args.employeeId) {
      const q = ctx.db
        .query("leaveRequests")
        .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId!));
      const results = await q.order("desc").collect();
      if (args.status) return results.filter((r) => r.status === args.status);
      return results;
    }

    if (args.status) {
      return await ctx.db
        .query("leaveRequests")
        .withIndex("by_workspace_status", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("status", args.status!)
        )
        .order("desc")
        .collect();
    }

    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const submit = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    leaveType: LEAVE_TYPE,
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(),   // "YYYY-MM-DD"
    daysCount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const m = await requireMember(ctx, userId, args.workspaceId);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found in workspace");
    }

    if (m.role === "member" && employee.userId !== userId) {
      throw new ConvexError("Forbidden: You cannot submit leave requests for another employee");
    }

    if (args.startDate > args.endDate) {
      throw new ConvexError("Start date cannot be after end date");
    }

    if (args.daysCount <= 0) {
      throw new ConvexError("Days count must be greater than 0");
    }

    const now = Date.now();
    const requestId = await ctx.db.insert("leaveRequests", {
      workspaceId: args.workspaceId,
      employeeId: args.employeeId,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      daysCount: args.daysCount,
      reason: args.reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "leave.submit", {
      requestId,
      employeeId: args.employeeId,
    });

    return requestId;
  },
});

export const review = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    requestId: v.id("leaveRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewRemarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const request = await ctx.db.get(args.requestId);
    if (!request || request.workspaceId !== args.workspaceId) {
      throw new ConvexError("Leave request not found");
    }

    if (request.status !== "pending") {
      throw new ConvexError(`Cannot review a request that is already ${request.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      status: args.status,
      reviewedBy: userId,
      reviewRemarks: args.reviewRemarks,
      reviewedAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "leave.review", {
      requestId: args.requestId,
      status: args.status,
    });
  },
});

export const getMyLeaves = query({
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

    if (!me) return [];

    return await ctx.db
      .query("leaveRequests")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .order("desc")
      .collect();
  },
});

export const submitMyLeave = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    leaveType: v.union(v.literal("sick"), v.literal("casual"), v.literal("earned"), v.literal("unpaid")),
    startDate: v.string(), // YYYY-MM-DD
    endDate: v.string(), // YYYY-MM-DD
    reason: v.string(),
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
      throw new ConvexError("No employee record linked to your account.");
    }

    if (args.startDate > args.endDate) {
      throw new ConvexError("Start date must be on or before end date");
    }

    const start = new Date(args.startDate);
    const end = new Date(args.endDate);
    const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const now = Date.now();
    const requestId = await ctx.db.insert("leaveRequests", {
      workspaceId: args.workspaceId,
      employeeId: me._id,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      daysCount,
      reason: args.reason,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "leave.submit_my", {
      requestId,
      employeeId: me._id,
    });

    return requestId;
  },
});
