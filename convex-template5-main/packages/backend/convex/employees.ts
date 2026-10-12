import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireMember, requireRole } from "./orgs";
import { audit } from "./auditLog";

export const list = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    let q = ctx.db
      .query("employees")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    if (args.status) {
      q = ctx.db
        .query("employees")
        .withIndex("by_workspace_status", (q) =>
          q
            .eq("workspaceId", args.workspaceId)
            .eq("status", args.status as any),
        );
    }

    return await q.order("desc").collect();
  },
});

export const add = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const normalizedEmail = args.email.trim().toLowerCase();

    const existing = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .first();

    if (existing) {
      throw new ConvexError("An employee with this email already exists in this workspace");
    }

    const now = Date.now();
    const employeeId = await ctx.db.insert("employees", {
      workspaceId: args.workspaceId,
      firstName: args.firstName,
      lastName: args.lastName,
      email: normalizedEmail,
      phone: args.phone,
      department: args.department,
      designation: args.designation,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await audit(ctx, args.workspaceId, userId, "employee.add", {
      employeeId,
      email: args.email,
    });
    return employeeId;
  },
});

export const update = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    department: v.optional(v.string()),
    designation: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    userId: v.optional(v.union(v.id("users"), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found");
    }

    const { workspaceId, employeeId, userId: incomingUserId, ...updates } = args;
    const finalUpdates: any = { ...updates, updatedAt: Date.now() };
    
    if (incomingUserId !== undefined) {
      finalUpdates.userId = incomingUserId === null ? undefined : incomingUserId;
    }

    if (updates.email) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      const existing = await ctx.db
        .query("employees")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
        .first();

      if (existing && existing._id !== args.employeeId) {
        throw new ConvexError("An employee with this email already exists in this workspace");
      }
      finalUpdates.email = normalizedEmail;
    }

    await ctx.db.patch(employeeId, finalUpdates);

    await audit(ctx, args.workspaceId, userId, "employee.update", {
      employeeId,
    });
  },
});

export const deactivate = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    employeeId: v.id("employees"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireRole(ctx, userId, args.workspaceId, ["owner", "admin"]);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee || employee.workspaceId !== args.workspaceId) {
      throw new ConvexError("Employee not found");
    }

    await ctx.db.patch(args.employeeId, {
      status: "inactive",
      updatedAt: Date.now(),
    });
    await audit(ctx, args.workspaceId, userId, "employee.deactivate", {
      employeeId: args.employeeId,
    });
  },
});

export const linkMyAccount = mutation({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    const user = await ctx.db.get(userId);
    if (!user || !user.email) throw new ConvexError("No email on your account.");
    
    // Check if verified
    if (!user.emailVerificationTime) {
      throw new ConvexError("Your email address is not verified.");
    }
    
    // Ensure the user hasn't already linked to an employee in this workspace
    const alreadyLinked = await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .first();
    if (alreadyLinked) {
      return alreadyLinked._id;
    }

    // Find by email in the workspace (normalized to lowercase)
    const normalizedEmail = user.email.trim().toLowerCase();
    const matches = await ctx.db
      .query("employees")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId))
      .collect();
      
    if (matches.length === 0) {
      throw new ConvexError(`No employee record found for email ${user.email} in this workspace.`);
    }
    if (matches.length > 1) {
      throw new ConvexError(`Ambiguous match: multiple employee records share the email ${user.email}. Contact HR.`);
    }

    const employee = matches[0];
    if (!employee) throw new ConvexError("No employee found");
    if (employee.userId) {
      throw new ConvexError("This employee record is already claimed by another user.");
    }

    await ctx.db.patch(employee._id, { userId });
    await audit(ctx, args.workspaceId, userId, "employee.linked", {
      employeeId: employee._id,
    });
    
    return employee._id;
  },
});

export const getMyProfile = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await requireMember(ctx, userId, args.workspaceId);

    return await ctx.db
      .query("employees")
      .withIndex("by_workspace_user", (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId))
      .first();
  },
});

