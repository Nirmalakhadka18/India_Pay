import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

export const getMyResignation = query({
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

    if (!me) return null;

    const resignations = await ctx.db
      .query("resignations")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .order("desc")
      .collect();

    return resignations[0] ?? null;
  },
});

export const submitResignation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    proposedResignationDate: v.string(), // "YYYY-MM-DD"
    noticePeriodDays: v.number(),
    reason: v.optional(v.string()),
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
      throw new ConvexError("No employee record linked to your account.");
    }

    // Check if there is already an active/pending resignation
    const existing = await ctx.db
      .query("resignations")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();

    const pending = existing.find((r) => r.status === "pending");
    if (pending) {
      throw new ConvexError(
        "You already have a pending resignation request submitted.",
      );
    }

    if (args.noticePeriodDays < 0 || args.noticePeriodDays > 180) {
      throw new ConvexError("Notice period must be between 0 and 180 days.");
    }

    // Calculate expected last working day
    const propDate = new Date(args.proposedResignationDate);
    if (Number.isNaN(propDate.getTime())) {
      throw new ConvexError("Invalid proposed resignation date.");
    }
    const lwdDate = new Date(propDate);
    lwdDate.setDate(lwdDate.getDate() + args.noticePeriodDays);
    const expectedLastWorkingDay = lwdDate.toISOString().slice(0, 10);

    const now = Date.now();
    const id = await ctx.db.insert("resignations", {
      workspaceId: args.workspaceId,
      employeeId: me._id,
      proposedResignationDate: args.proposedResignationDate,
      noticePeriodDays: args.noticePeriodDays,
      expectedLastWorkingDay,
      reason: args.reason?.trim() || undefined,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "resignation.submit", {
      resignationId: id,
      employeeId: me._id,
      expectedLastWorkingDay,
    });

    return id;
  },
});

export const withdrawResignation = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    resignationId: v.id("resignations"),
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

    if (!me) throw new ConvexError("Employee record not found.");

    const resignation = await ctx.db.get(args.resignationId);
    if (
      !resignation ||
      resignation.workspaceId !== args.workspaceId ||
      resignation.employeeId !== me._id
    ) {
      throw new ConvexError("Resignation request not found.");
    }

    if (resignation.status !== "pending") {
      throw new ConvexError(
        `Cannot withdraw a resignation with status '${resignation.status}'.`,
      );
    }

    await ctx.db.patch(args.resignationId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });

    await audit(ctx, args.workspaceId, userId, "resignation.withdraw", {
      resignationId: args.resignationId,
      employeeId: me._id,
    });

    return { success: true };
  },
});

export const listResignationsAdmin = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const list = await ctx.db
      .query("resignations")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .order("desc")
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();
    const empMap = new Map(employees.map((e) => [e._id, e]));

    return list.map((r) => ({
      ...r,
      employee: empMap.get(r.employeeId)
        ? {
            firstName: empMap.get(r.employeeId)!.firstName,
            lastName: empMap.get(r.employeeId)!.lastName,
            employeeIdNumber:
              empMap.get(r.employeeId)!.employeeIdNumber ??
              empMap.get(r.employeeId)!._id.slice(-6).toUpperCase(),
            department: empMap.get(r.employeeId)!.department,
            designation: empMap.get(r.employeeId)!.designation,
          }
        : null,
    }));
  },
});

export const reviewResignationAdmin = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    resignationId: v.id("resignations"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    approvedLastWorkingDay: v.optional(v.string()),
    hrComments: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["admin"]);

    const resignation = await ctx.db.get(args.resignationId);
    if (!resignation || resignation.workspaceId !== args.workspaceId) {
      throw new ConvexError("Resignation request not found.");
    }

    const now = Date.now();
    await ctx.db.patch(args.resignationId, {
      status: args.status,
      approvedLastWorkingDay: args.approvedLastWorkingDay ?? resignation.expectedLastWorkingDay,
      hrComments: args.hrComments?.trim(),
      reviewedBy: userId,
      reviewedAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "resignation.review", {
      resignationId: args.resignationId,
      status: args.status,
    });

    return { success: true };
  },
});
