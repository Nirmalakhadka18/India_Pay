import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember } from "./orgs";
import { audit } from "./auditLog";

export const getMyDelegates = query({
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

    if (!me) return [];

    const delegates = await ctx.db
      .query("workflowDelegates")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return delegates.map((d) => {
      const target = empMap.get(d.delegateEmployeeId);
      return {
        ...d,
        delegateName: target ? `${target.firstName} ${target.lastName}` : "Unknown",
        delegateEmpId: target ? (target.employeeIdNumber ?? target._id.slice(-6).toUpperCase()) : "",
        delegateDesignation: target ? target.designation : "",
      };
    });
  },
});

export const setDelegate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    delegateEmployeeId: v.id("employees"),
    workflowType: v.union(
      v.literal("leave_approvals"),
      v.literal("attendance_approvals"),
      v.literal("all"),
    ),
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
    notes: v.optional(v.string()),
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

    if (!me) throw new ConvexError("Employee profile not found.");

    if (args.delegateEmployeeId === me._id) {
      throw new ConvexError("Cannot delegate workflows to yourself.");
    }

    const now = Date.now();
    const id = await ctx.db.insert("workflowDelegates", {
      workspaceId: args.workspaceId,
      employeeId: me._id,
      delegateEmployeeId: args.delegateEmployeeId,
      workflowType: args.workflowType,
      startDate: args.startDate,
      endDate: args.endDate,
      status: "active",
      notes: args.notes?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "delegate.create", {
      delegateId: id,
      delegateEmployeeId: args.delegateEmployeeId,
      workflowType: args.workflowType,
    });

    return id;
  },
});

export const deactivateDelegate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    delegateId: v.id("workflowDelegates"),
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

    if (!me) throw new ConvexError("Employee profile not found.");

    const item = await ctx.db.get(args.delegateId);
    if (!item || item.workspaceId !== args.workspaceId || item.employeeId !== me._id) {
      throw new ConvexError("Delegate record not found.");
    }

    await ctx.db.patch(args.delegateId, {
      status: "inactive",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
