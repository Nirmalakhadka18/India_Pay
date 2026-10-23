import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

export const listMyTickets = query({
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

    const tickets = await ctx.db
      .query("helpdeskTickets")
      .withIndex("by_employee", (q) => q.eq("employeeId", me._id))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .order("desc")
      .collect();

    return tickets;
  },
});

export const createTicket = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    category: v.union(
      v.literal("payroll"),
      v.literal("leaves"),
      v.literal("attendance"),
      v.literal("benefits"),
      v.literal("general"),
    ),
    subject: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
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
      throw new ConvexError("No employee profile linked to your account.");
    }

    if (!args.subject.trim()) {
      throw new ConvexError("Ticket subject cannot be empty.");
    }

    if (!args.description.trim()) {
      throw new ConvexError("Ticket description cannot be empty.");
    }

    const now = Date.now();
    const count = (await ctx.db
      .query("helpdeskTickets")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect()).length + 1;

    const ticketNumber = `HD-${String(count).padStart(4, "0")}`;

    const ticketId = await ctx.db.insert("helpdeskTickets", {
      workspaceId: args.workspaceId,
      employeeId: me._id,
      ticketNumber,
      category: args.category,
      subject: args.subject.trim(),
      description: args.description.trim(),
      priority: args.priority,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "helpdesk.create", {
      ticketId,
      ticketNumber,
    });

    return ticketNumber;
  },
});
